import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import Editor from "@monaco-editor/react";
import { getApiBaseUrl } from '../utils/config.js';

function CreateNewThread() {
    const [threadName, setThreadName] = useState("");
    const [threadDescription, setThreadDescription] = useState("");
    const [threadCode, setThreadCode] = useState("");
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
            const response = await fetch(`${apiBaseUrl}/api/threads/addThreadAPI`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    thread_name: threadName,
                    thread_description: threadDescription,
                    thread_string: threadCode,
                }),
            });

            const data = await response.json();
            if (data.message === "Success") {
                setSuccess("Thread created successfully!");
                setTimeout(() => navigate("/apiengine"), 2000);
            } else {
                setError(data.message || "Failed to create thread.");
            }
        } catch (err) {
            console.error("Error creating thread:", err);
            setError("An error occurred while creating the thread.");
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                <h1>Create New Thread</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>Thread Name:</label>
                        <input
                            type="text"
                            value={threadName}
                            onChange={(e) => setThreadName(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <input
                            type="text"
                            value={threadDescription}
                            onChange={(e) => setThreadDescription(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Python Code:</label>
                        <Editor
                            height="400px"
                            defaultLanguage="python"
                            value={threadCode}
                            onChange={(value) => setThreadCode(value)}
                            theme="light"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#007BFF",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Create Thread
                        </button>
                    </div>

                    {error && (
                        <p style={{ color: "red" }}>{error}</p>
                    )}
                    {success && (
                        <p style={{ color: "green" }}>{success}</p>
                    )}
                </form>
            </div>
        </div>
    );
}

export default CreateNewThread; 