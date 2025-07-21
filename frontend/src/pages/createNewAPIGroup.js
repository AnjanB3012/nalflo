import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { getApiBaseUrl } from '../utils/config.js';

function CreateNewAPIGroup() {
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/apis/createAPIGroup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    group_name: groupName,
                    group_description: groupDescription,
                }),
            });

            const data = await response.json();
            if (data.message === "Success") {
                setSuccess("API group created successfully!");
                setTimeout(() => navigate("/apiengine"), 2000);
            } else {
                setError(data.message || "Failed to create API group.");
            }
        } catch (err) {
            console.error("Error creating API group:", err);
            setError("An error occurred while creating the API group.");
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                <h1>Create New API Group</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>API Group Name:</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <textarea
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            required
                            rows="4"
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: "red", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "5px" }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ color: "green", padding: "10px", backgroundColor: "#e6ffe6", borderRadius: "5px" }}>
                            {success}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="submit"
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer"
                            }}
                        >
                            Create API Group
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/apiengine")}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateNewAPIGroup; 