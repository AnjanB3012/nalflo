import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import Editor from "@monaco-editor/react";
import Navbar from "../components/navbar";

function ViewAPI() {
    const { apiName } = useParams();
    const [api, setApi] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookieToken, setCookieToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editedApiString, setEditedApiString] = useState("");
    const navigate = useNavigate();

    // Function to format API string for display
    const formatApiString = (apiString) => {
        if (!apiString) return "";
        // Split by <break> and join with newlines, preserving indentation
        return apiString.split("<break>").join("\n");
    };

    useEffect(() => {
        try {
            const parsedCookie = JSON.parse(localStorage.getItem("local_cookie"));
            if (!parsedCookie || !parsedCookie.token) {
                setError(true);
                setErrorMessage("No session found. Please log in again.");
                setTimeout(() => navigate("/login"), 2000);
                return;
            }
            setCookieToken(parsedCookie.token);
        } catch (e) {
            setError(true);
            setErrorMessage("Invalid session. Please log in again");
            return;
        }
    }, [navigate]);

    useEffect(() => {
        if (!cookieToken) return;

        fetch("http://localhost:8080/api/apis/viewAPI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                api_name: apiName,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Success") {
                setApi(data.api);
                setEditedApiString(formatApiString(data.api.apiString));
            } else {
                setError(true);
                setErrorMessage(data.message);
            }
        })
        .catch((err) => {
            console.error("Error fetching API:", err);
            setError(true);
            setErrorMessage("Error fetching API details");
        });
    }, [cookieToken, apiName]);

    const handleEditClick = () => {
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setEditedApiString(api.apiString);
        setStatusMessage("");
    };

    const handleSaveEdit = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        setIsLoading(true);
        setStatusMessage("Saving changes...");

        try {
            // Format the edited code back to the expected format with <break> markers
            const formattedApiString = editedApiString.split('\n').join('<break>');

            const response = await fetch("http://localhost:8080/api/apis/modifyAPI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    api_name: apiName,
                    new_api_string: formattedApiString,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh API data
                const apiResponse = await fetch("http://localhost:8080/api/apis/viewAPI", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        api_name: apiName,
                    }),
                });
                const apiData = await apiResponse.json();
                if (apiData.message === "Success") {
                    setApi(apiData.api);
                }
                setStatusMessage("API updated successfully!");
                setTimeout(() => {
                    handleEditDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to modify APIs");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while updating the API");
            }
        } catch (error) {
            console.error("Error updating API:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setStatusMessage("");
    };

    const handleDelete = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        setIsLoading(true);
        setStatusMessage("Deleting API...");

        try {
            const response = await fetch("http://localhost:8080/api/apis/deleteAPI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    api_name: apiName,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setStatusMessage("API deleted successfully!");
                setTimeout(() => {
                    navigate("/apiengine");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to delete APIs");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while deleting the API");
            }
        } catch (error) {
            console.error("Error deleting API:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                    <div style={{ color: "red" }}>{errorMessage}</div>
                </div>
            </div>
        );
    }

    if (!api) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                <h1>View API</h1>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>API Name:</label>
                        <input
                            type="text"
                            value={api.apiName}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <input
                            type="text"
                            value={api.apiDescription}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label>API Endpoint:</label>
                        <input
                            type="text"
                            value={api.apiEndpoint}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label>Python Code:</label>
                        <Editor
                            height="250px"
                            defaultLanguage="python"
                            value={formatApiString(api.apiString)}
                            theme="light"
                            options={{ readOnly: true }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                            onClick={() => navigate("/apiengine")}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#dc3545",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            disabled={isLoading}
                        >
                            Delete API
                        </button>
                        <button
                            onClick={handleEditClick}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#007BFF",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            disabled={isLoading}
                        >
                            Edit API
                        </button>
                    </div>

                    {statusMessage && (
                        <p style={{ color: statusMessage.includes("success") ? "green" : "red" }}>
                            {statusMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit API Implementation</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ marginBottom: "15px" }}>
                        Modify the API implementation below:
                    </DialogContentText>
                    <div style={{ height: "400px" }}>
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            value={editedApiString}
                            onChange={(value) => setEditedApiString(value)}
                            theme="light"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose}>Cancel</Button>
                    <Button onClick={handleSaveEdit} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteDialogClose}
            >
                <DialogTitle>Delete API</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this API? This action cannot be undone.
                    </DialogContentText>
                    <DialogContentText style={{ color: '#ff9800', marginTop: '10px' }}>
                        Note: The system will need to be restarted for the changes to take effect.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteDialogClose}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" disabled={isLoading}>
                        {isLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ViewAPI; 