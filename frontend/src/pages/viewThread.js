import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import Editor from "@monaco-editor/react";
import Navbar from "../components/Navbar";

function ViewThread() {
    const { threadName } = useParams();
    const [thread, setThread] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookieToken, setCookieToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editedThreadString, setEditedThreadString] = useState("");
    const navigate = useNavigate();

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

        fetch("http://localhost:8080/api/threads/viewThread", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                thread_name: threadName,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Success") {
                setThread(data.thread);
                setEditedThreadString(data.thread.threadString);
            } else {
                setError(true);
                setErrorMessage(data.message);
            }
        })
        .catch((err) => {
            console.error("Error fetching thread:", err);
            setError(true);
            setErrorMessage("Error fetching thread details");
        });
    }, [cookieToken, threadName]);

    const handleEditClick = () => {
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setEditedThreadString(thread.threadString);
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
            const response = await fetch("http://localhost:8080/api/threads/modifyThreadAPI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    thread_name: threadName,
                    new_thread_string: editedThreadString,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh thread data
                const threadResponse = await fetch("http://localhost:8080/api/threads/viewThread", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        thread_name: threadName,
                    }),
                });
                const threadData = await threadResponse.json();
                if (threadData.message === "Success") {
                    setThread(threadData.thread);
                }
                setStatusMessage("Thread updated successfully!");
                setTimeout(() => {
                    handleEditDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to modify threads");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while updating the thread");
            }
        } catch (error) {
            console.error("Error updating thread:", error);
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
        setStatusMessage("Deleting thread...");

        try {
            const response = await fetch("http://localhost:8080/api/threads/removeThreadAPI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    thread_name: threadName,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setStatusMessage("Thread deleted successfully!");
                setTimeout(() => {
                    navigate("/apiengine");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to delete threads");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while deleting the thread");
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
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

    if (!thread) {
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
                <h1>View Thread</h1>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>Thread Name:</label>
                        <input
                            type="text"
                            value={thread.threadName}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <input
                            type="text"
                            value={thread.threadDescription}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label>Python Code:</label>
                        <Editor
                            height="250px"
                            defaultLanguage="python"
                            value={thread.threadString}
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
                            Delete Thread
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
                            Edit Thread
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
                <DialogTitle>Edit Thread Implementation</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ marginBottom: "15px" }}>
                        Modify the thread implementation below:
                    </DialogContentText>
                    <div style={{ height: "400px" }}>
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            value={editedThreadString}
                            onChange={(value) => setEditedThreadString(value)}
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
                <DialogTitle>Delete Thread</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this thread? This action cannot be undone.
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

export default ViewThread; 