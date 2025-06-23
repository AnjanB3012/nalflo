import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import "../styles/iam.css";
import { getApiBaseUrl } from '../utils/config.js';

function CreateGroup() {
    const [groupTitle, setGroupTitle] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [permissions, setPermissions] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPermissions = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                setError(true);
                setErrorMessage("Please log in to create a group");
                return;
            }

            try {
                const parsedCookie = JSON.parse(cookieData);
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/getUserPermissions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: parsedCookie.token }),
                });
                const data = await response.json();
                
                if (data.message === "Success") {
                    if (!data.permissions.iam) {
                        setError(true);
                        setErrorMessage("You don't have permission to create groups");
                        return;
                    }
                    setPermissions(data.permissions);
                } else {
                    setError(true);
                    setErrorMessage("Failed to verify permissions");
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setError(true);
                setErrorMessage("Failed to connect to the server");
            }
        };
        fetchPermissions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!groupTitle.trim()) {
            setErrorMessage("Group title is required");
            setError(true);
            return;
        }

        if (!groupDescription.trim()) {
            setErrorMessage("Group description is required");
            setError(true);
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setErrorMessage("Please log in to create a group");
            setError(true);
            return;
        }

        try {
            const parsedCookie = JSON.parse(cookieData);
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/iam/createGroup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: parsedCookie.token,
                    group_title: groupTitle.trim(),
                    group_description: groupDescription.trim(),
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                navigate("/iam");
            } else {
                setError(true);
                setErrorMessage(data.message || "Failed to create group");
            }
        } catch (error) {
            console.error("Error creating group:", error);
            setError(true);
            setErrorMessage("Failed to connect to the server");
        }
    };

    if (error) {
        return (
            <div>
                {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} apisPermission={permissions?.development} />}
                <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ color: "red" }}>{errorMessage}</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} apisPermission={permissions?.development} />}
            <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                <h1>Create New Group</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>Group Title:</label>
                        <input
                            type="text"
                            value={groupTitle}
                            onChange={(e) => setGroupTitle(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <textarea
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            rows={3}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                        <button
                            type="button"
                            onClick={() => navigate("/iam")}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#f0f0f0",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#007BFF",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateGroup; 