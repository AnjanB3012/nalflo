import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function CreateNewRole() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [rolePermissions, setRolePermissions] = useState({
        home: false,
        iam: false,
        AssignToAll: false
    });
    const navigate = useNavigate();

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            setErrorMessage("Please log in to create a new role");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        fetch("http://localhost:8080/api/getUserPermissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cookie_token: parsedCookie.token }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    if (!data.permissions.iam) {
                        setError(true);
                        setErrorMessage("You don't have permission to create roles");
                        return;
                    }
                    setPermissions(data.permissions);
                } else {
                    setError(true);
                    setErrorMessage("Failed to verify permissions");
                }
            })
            .catch((err) => {
                console.error("Error fetching permissions:", err);
                setError(true);
                setErrorMessage("Failed to connect to the server");
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!roleName.trim()) {
            setErrorMessage("Role name is required");
            setError(true);
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        const parsedCookie = JSON.parse(cookieData);

        fetch("http://localhost:8080/api/iam/createRole", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: parsedCookie.token,
                role_name: roleName,
                role_description: roleDescription,
                permissions: rolePermissions
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    navigate("/iam");
                } else {
                    setError(true);
                    setErrorMessage("Failed to create role");
                }
            })
            .catch((err) => {
                console.error("Error creating role:", err);
                setError(true);
                setErrorMessage("Failed to connect to the server");
            });
    };

    const handlePermissionChange = (permission) => {
        setRolePermissions({
            ...rolePermissions,
            [permission]: !rolePermissions[permission]
        });
    };

    if (error) {
        return (
            <div>
                {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
                <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ color: "red" }}>{errorMessage}</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                <h1>Create New Role</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>Role Name:</label>
                        <input
                            type="text"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Description:</label>
                        <textarea
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            rows={3}
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>

                    <div>
                        <label>Permissions:</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "5px" }}>
                            {Object.entries(rolePermissions).map(([permission, value]) => (
                                <div key={permission} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handlePermissionChange(permission)}
                                        style={{ width: "16px", height: "16px" }}
                                    />
                                    <label style={{ textTransform: "capitalize" }}>
                                        {permission}
                                    </label>
                                </div>
                            ))}
                        </div>
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
                            Create Role
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateNewRole; 