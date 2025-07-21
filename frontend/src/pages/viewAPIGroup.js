import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { getApiBaseUrl } from '../utils/config.js';

function ViewAPIGroup() {
    const { groupName } = useParams();
    const [apiGroup, setApiGroup] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAPIGroup = async () => {
            try {
                const cookieData = localStorage.getItem("local_cookie");
                if (!cookieData) {
                    setError(true);
                    setErrorMessage("No session found. Please log in again.");
                    setTimeout(() => navigate("/login"), 2000);
                    return;
                }

                const parsedCookie = JSON.parse(cookieData);
                const cookieToken = parsedCookie.token;

                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/apis/viewAPIGroup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        group_name: groupName,
                    }),
                });

                const data = await response.json();
                if (data.message === "Success") {
                    setApiGroup(data.apiGroup);
                } else {
                    setError(true);
                    setErrorMessage(data.message || "Failed to fetch API group");
                }
            } catch (err) {
                console.error("Error fetching API group:", err);
                setError(true);
                setErrorMessage("Error fetching API group details");
            } finally {
                setLoading(false);
            }
        };

        fetchAPIGroup();
    }, [groupName, navigate]);

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

    if (loading) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!apiGroup) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                    <div style={{ color: "red" }}>API group not found</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h1>View API Group</h1>
                    <button
                        onClick={() => navigate("/apiengine")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        Back to API Engine
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ fontWeight: "bold" }}>API Group Name:</label>
                        <input
                            type="text"
                            value={apiGroup.apiGroupName}
                            readOnly
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontWeight: "bold" }}>Description:</label>
                        <textarea
                            value={apiGroup.apiGroupDescription}
                            readOnly
                            rows="4"
                            style={{ width: "100%", padding: "8px", marginTop: "5px", backgroundColor: "#f5f5f5" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontWeight: "bold" }}>APIs in this group ({apiGroup.apis.length}):</label>
                        {apiGroup.apis.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>API Name</th>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Description</th>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Endpoint</th>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiGroup.apis.map((api) => (
                                        <tr key={api.apiName}>
                                            <td style={{ padding: "10px", border: "1px solid #ddd" }}>{api.apiName}</td>
                                            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                                {api.developerVisibility ? api.apiDescription : "N/A"}
                                            </td>
                                            <td style={{ padding: "10px", border: "1px solid #ddd" }}>{api.apiEndpoint}</td>
                                            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                                <button
                                                    onClick={() => navigate(`/viewAPI/${api.apiName}`)}
                                                    style={{
                                                        padding: "5px 10px",
                                                        backgroundColor: "#28a745",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "3px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    View API
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: "#666", fontStyle: "italic" }}>No APIs in this group yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewAPIGroup; 