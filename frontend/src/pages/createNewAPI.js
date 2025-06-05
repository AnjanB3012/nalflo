import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Editor from "@monaco-editor/react";

function CreateNewAPI() {
    const [apiName, setAPIName] = useState("");
    const [apiDescription, setAPIDescription] = useState("");
    const [apiEndpoint, setAPIEndpoint] = useState("");
    const [apiCode, setAPICode] = useState("");
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

        // Reformat the code to match API expectation
        const formattedCode = apiCode
            .replace(/\r\n|\r/g, "\n") // Normalize all line endings
            .split("\n")
            .map(line => {
                const trimmedLine = line.replace(/^\s*/, ""); // remove leading spaces
                const indentLevel = Math.floor((line.length - trimmedLine.length) / 4);
                const escapedLine = trimmedLine.replace(/"/g, '\\"');
                return " ".repeat(indentLevel * 4) + escapedLine;
            })
            .join("<break>");


        try {
            const response = await fetch("http://localhost:8080/api/apis/addNewAPI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    api_name: apiName,
                    api_description: apiDescription,
                    api_endpoint: apiEndpoint,
                    api_string: formattedCode, // send the transformed string
                }),
            });

            const data = await response.json();
            if (data.message === "Success") {
                setSuccess("API created successfully!");
                setTimeout(() => navigate("/apiengine"), 2000);
            } else {
                setError(data.message || "Failed to create API.");
            }
        } catch (err) {
            console.error("Error creating API:", err);
            setError("An error occurred while creating the API.");
        }
    };


    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                <h1>Create New API</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>API Name:</label>
                        <input
                            type="text"
                            value={apiName}
                            onChange={(e) => setAPIName(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <input
                            type="text"
                            value={apiDescription}
                            onChange={(e) => setAPIDescription(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>API Endpoint:</label>
                        <input
                            type="text"
                            value={apiEndpoint}
                            onChange={(e) => setAPIEndpoint(e.target.value)}
                            required
                            placeholder="/api/..."
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Python Code:</label>
                        <Editor
                            height="250px"
                            defaultLanguage="python"
                            value={apiCode}
                            theme="light"
                            onChange={(value) => setAPICode(value || "")}
                        />
                    </div>

                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={() => navigate("/apiengine")}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#dc3545",
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
                            Create API
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateNewAPI;
