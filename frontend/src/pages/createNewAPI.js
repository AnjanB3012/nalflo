import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import Editor from "@monaco-editor/react";
import { getApiBaseUrl } from '../utils/config.js';

function CreateNewAPI() {
    const [apiName, setAPIName] = useState("");
    const [apiDescription, setAPIDescription] = useState("");
    const [apiEndpoint, setAPIEndpoint] = useState("");
    const [apiCode, setAPICode] = useState("");
    const [apiGroup, setAPIGroup] = useState("System APIs");
    const [apiGroups, setAPIGroups] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const [aiProcessingModels, setAiProcessingModels] = useState([]);

    // Fetch API groups on component mount
    useEffect(() => {
        const fetchAPIGroups = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) return;

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try {
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/apis/getAllAPIGroups`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const data = await response.json();
                if (data.message === "Success") {
                    setAPIGroups(data.apiGroups);
                }
            } catch (err) {
                console.error("Error fetching API groups:", err);
            }
        };

        fetchAPIGroups();
    }, []);

    const handleModelChange = (model) => {
        setAiProcessingModels((prev) =>
            prev.includes(model)
                ? prev.filter((m) => m !== model)
                : [...prev, model]
        );
    };

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
            .replace(/\t/g, "    ")      // Replace tabs with 4 spaces
            .split("\n")
            .join("<break>");


        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/apis/addNewAPI`, {
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
                    api_group: apiGroup,
                    ai_processing_models: aiProcessingModels,
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
                        <label>API Group:</label>
                        <select
                            value={apiGroup}
                            onChange={(e) => setAPIGroup(e.target.value)}
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        >
                            {apiGroups.map((group) => (
                                <option key={group.apiGroupName} value={group.apiGroupName}>
                                    {group.apiGroupName}
                                </option>
                            ))}
                        </select>
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

                    <div>
                        <label>AI Processing Models:</label>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={aiProcessingModels.includes('NalAI')}
                                    onChange={() => handleModelChange('NalAI')}
                                />
                                NalAI
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={aiProcessingModels.includes('Nalva')}
                                    onChange={() => handleModelChange('Nalva')}
                                />
                                Nalva
                            </label>
                        </div>
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
