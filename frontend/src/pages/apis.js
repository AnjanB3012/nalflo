import { use, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../styles/apis.css";

function API()
{
    const [permissions, setPermissions] = useState([]);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [apis, setAPIs] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchAPIs = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if(!cookieData)
            {
                Navigate('/login');
                return;
            }
            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try
            {
                const response = await fetch("http://localhost:8080/api/getUserPermissions", {
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
                    const allAPIs = await fetch("http://localhost:8080/api/apis/getAllAPIs", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const allAPIsData = await allAPIs.json();
                    if (allAPIsData.message === "Success")
                    {
                        setAPIs(allAPIsData.apis);
                    }
                    else
                    {
                        setError(true);
                        setErrorMessage("Failed to fetch APIs. Please try again later.");
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
                console.error("Error fetching APIs:", error);
                setError(true);
                setErrorMessage("Failed to fetch APIs. Please try again later.");
            }
            finally
            {
                setLoading(false);
            }
        }
        fetchAPIs();
    }, []);
    if (error) {
        return (
            <div className="iam-container">
                <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} apisPermission={permissions?.development} />
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
                <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} apisPermission={permissions?.development} />
                <div className="loading-message">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="api-container">
            <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} apisPermission={permissions?.development} />
            <h1 className="api-title">API Engine</h1>
            <div className="card-container">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">APIs</h2>
                        <button className="button button-primary" onClick={() => navigate("/createNewAPI")}>Create New API</button>
                    </div>
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
                            {apis.map((api) => (
                                <tr key={api.apiName}>
                                    <td>{api.apiName}</td>
                                    <td>{api.apiDescription}</td>
                                    <td>{api.apiEndpoint}</td>
                                    <td><button className="button button-success" onClick={() => navigate(`/viewAPI/${api.apiName}`)}>View</button></td>
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