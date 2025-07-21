import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import "../styles/apis.css";
import { getApiBaseUrl } from '../utils/config.js';

function API()
{
    const [permissions, setPermissions] = useState([]);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [apiGroups, setAPIGroups] = useState([]);
    const [threads, setThreads] = useState([]);
    const [files, setFiles] = useState([]);
    const [uploadError, setUploadError] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if(!cookieData)
            {
                navigate('/login');
                return;
            }
            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try
            {
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/getUserPermissions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken}),
                });
                const data = await response.json();
                if (data.message=== "Success")
                {
                    setPermissions(data.permissions);
                    const allAPIs = await fetch(`${apiBaseUrl}/api/apis/getAllAPIs`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const allAPIsData = await allAPIs.json();
                    if (allAPIsData.message === "Success")
                    {
                        setAPIGroups(allAPIsData.apiGroups);
                    }

                    // Fetch threads
                    const threadsResponse = await fetch(`${apiBaseUrl}/api/threads/getAllThreads`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const threadsData = await threadsResponse.json();
                    if (threadsData.message === "Success") {
                        setThreads(threadsData.threads);
                    }

                    // Fetch files
                    const filesResponse = await fetch(`${apiBaseUrl}/api/apis/getFiles`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const filesData = await filesResponse.json();
                    if (filesData.message === "Success") {
                        setFiles(filesData.files);
                    }
                }
                else
                {
                    setError(true);
                    setErrorMessage("Failed to fetch permissions. Please try again later.");
                }
            }
            catch (error)
            {
                console.error("Error fetching data:", error);
                setError(true);
                setErrorMessage("Failed to fetch data. Please try again later.");
            }
            finally
            {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setUploadError("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('cookie_token', cookieToken);

        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/apis/uploadFile`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.message === "Success") {
                setUploadSuccess("File uploaded successfully!");
                setUploadError("");
                // Refresh file list
                const filesResponse = await fetch(`${apiBaseUrl}/api/apis/getFiles`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const filesData = await filesResponse.json();
                if (filesData.message === "Success") {
                    setFiles(filesData.files);
                }
            } else {
                setUploadError(data.message || "Failed to upload file");
                setUploadSuccess("");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadError("Failed to upload file");
            setUploadSuccess("");
        }
    };

    const handleDownload = async (filename) => {
        const apiBaseUrl = await getApiBaseUrl();
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setUploadError("No cookie found. Please log in.");
            return;
        }
        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;
        
        try {
            // Make POST request to download endpoint
            const response = await fetch(`${apiBaseUrl}/api/apis/downloadFile/${filename}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cookie_token: cookieToken
                })
            });
            
            if (response.ok) {
                // Get the blob from the response
                const blob = await response.blob();
                
                // Create a download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up the URL object
                window.URL.revokeObjectURL(url);
                
                setUploadSuccess("Download completed!");
                setUploadError("");
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setUploadSuccess("");
                }, 3000);
            } else {
                const errorData = await response.json();
                setUploadError(errorData.message || "Failed to download file");
                setUploadSuccess("");
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            setUploadError("Failed to download file");
            setUploadSuccess("");
        }
    };

    const handleDeleteAPIGroup = async (groupName) => {
        if (!window.confirm(`Are you sure you want to delete the API group "${groupName}"?`)) {
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setUploadError("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/apis/deleteAPIGroup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    cookie_token: cookieToken,
                    group_name: groupName 
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                setUploadSuccess("API group deleted successfully!");
                setUploadError("");
                // Refresh API groups list
                const apisResponse = await fetch(`${apiBaseUrl}/api/apis/getAllAPIs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const apisData = await apisResponse.json();
                if (apisData.message === "Success") {
                    setAPIGroups(apisData.apiGroups);
                }
            } else {
                setUploadError(data.message || "Failed to delete API group");
                setUploadSuccess("");
            }
        } catch (error) {
            console.error("Error deleting API group:", error);
            setUploadError("Failed to delete API group");
            setUploadSuccess("");
        }
    };

    const handleDelete = async (filename) => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setUploadError("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/apis/removeFile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    filename: filename
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                setUploadSuccess("File deleted successfully!");
                setUploadError("");
                // Refresh file list
                const filesResponse = await fetch(`${apiBaseUrl}/api/apis/getFiles`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const filesData = await filesResponse.json();
                if (filesData.message === "Success") {
                    setFiles(filesData.files);
                }
            } else {
                setUploadError(data.message || "Failed to delete file");
                setUploadSuccess("");
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            setUploadError("Failed to delete file");
            setUploadSuccess("");
        }
    };

    if (error) {
        return (
            <div className="iam-container">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                    nalvaPermission={permissions?.nalva}
                />
                <div className="error-message">
                    <h2>Something went wrong</h2>
                    <p>{errorMessage}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="iam-container">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                    nalvaPermission={permissions?.nalva}
                />
                <div className="loading-message">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="api-container">
            <Navbar 
                HomePermission={permissions?.home} 
                IAMPermission={permissions?.iam} 
                apisPermission={permissions?.development}
                managementPermission={permissions?.management}
                nalvaPermission={permissions?.nalva}
            />
            <h1 className="api-title">API Engine</h1>
            <div className="card-container">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">API Groups</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="button button-primary" onClick={() => navigate("/createNewAPI")}>Create New API</button>
                            <button className="button button-secondary" onClick={() => navigate("/createNewAPIGroup")}>Create New API Group</button>
                        </div>
                    </div>
                    {apiGroups.map((apiGroup) => (
                        <div key={apiGroup.apiGroupName} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: '#333' }}>{apiGroup.apiGroupName}</h3>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="button button-success" onClick={() => navigate(`/viewAPIGroup/${apiGroup.apiGroupName}`)}>View Group</button>
                                    {apiGroup.apiGroupName !== "System APIs" && (
                                        <button className="button button-danger" onClick={() => handleDeleteAPIGroup(apiGroup.apiGroupName)}>Delete Group</button>
                                    )}
                                </div>
                            </div>
                            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>{apiGroup.apiGroupDescription}</p>
                            <table className="api-table">
                                <thead>
                                    <tr>
                                        <th>API Name</th>
                                        <th>API Description</th>
                                        <th>API Endpoint</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiGroup.apis.map((api) => (
                                        <tr key={api.apiName}>
                                            <td>{api.apiName}</td>
                                            <td>{api.developerVisibility ? api.apiDescription : "N/A"}</td>
                                            <td>{api.apiEndpoint}</td>
                                            <td><button className="button button-success" onClick={() => navigate(`/viewAPI/${api.apiName}`)}>View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Threads</h2>
                        <button className="button button-primary" onClick={() => navigate("/createNewThread")}>Create New Thread</button>
                    </div>
                    <table className="api-table">
                        <thead>
                            <tr>
                                <th>Thread Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {threads.map((thread) => (
                                <tr key={thread.threadName}>
                                    <td>{thread.threadName}</td>
                                    <td>{thread.threadDescription}</td>
                                    <td>
                                        <div className="button-group">
                                            <button 
                                                className="button button-success"
                                                onClick={() => navigate(`/viewThread/${thread.threadName}`)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Files</h2>
                        <div className="file-upload">
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload" className="button button-primary">
                                Upload File
                            </label>
                        </div>
                    </div>
                    {uploadError && <p className="error-message">{uploadError}</p>}
                    {uploadSuccess && <p className="success-message">{uploadSuccess}</p>}
                    <table className="api-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Size</th>
                                <th>Last Modified</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.name}>
                                    <td>{file.name}</td>
                                    <td>{(file.size / 1024).toFixed(2)} KB</td>
                                    <td>{file.modified}</td>
                                    <td>
                                        <div className="button-group">
                                            <button 
                                                className="button button-success"
                                                onClick={() => handleDownload(file.name)}
                                            >
                                                Download
                                            </button>
                                            <button 
                                                className="button button-danger"
                                                onClick={() => handleDelete(file.name)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default API;