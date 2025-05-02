import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function CreateNewUser() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [name, setName] = useState(""); // New state for the user's name
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [domain, setDomain] = useState(""); // State to store the domain
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch the domain from the API
        fetch("http://localhost:8080/api/getDomain")
            .then((response) => response.json())
            .then((data) => {
                if (data.domain) {
                    setDomain(data.domain);
                } else {
                    setError("Failed to fetch domain.");
                }
            })
            .catch((err) => {
                console.error("Error fetching domain:", err);
                setError("An error occurred while fetching the domain.");
            });
    }, []);

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        fetch("http://localhost:8080/api/iam/getAllRoleNames", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cookie_token: cookieToken }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    setRoles(data.roles);
                } else {
                    setError("Failed to fetch roles.");
                }
            })
            .catch((err) => {
                console.error("Error fetching roles:", err);
                setError("An error occurred while fetching roles.");
            });
    }, []);

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
            const response = await fetch("http://localhost:8080/api/iam/createNewUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    new_username: username.includes("@") ? username : `${username}@${domain}`, // Append domain if not already present
                    new_password: password,
                    new_role_name: role,
                    nameOfUser: name, // Include the user's name in the request
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setSuccess("User created successfully!");
                setTimeout(() => navigate("/iam"), 2000); // Redirect to IAM page after 2 seconds
            } else {
                setError(data.message || "Failed to create user.");
            }
        } catch (err) {
            console.error("Error creating user:", err);
            setError("An error occurred while creating the user.");
        }
    };

    const openRoleDialog = () => {
        setRoleDialogOpen(true);
    };

    const closeRoleDialog = () => {
        setRoleDialogOpen(false);
    };

    const selectRole = (selectedRole) => {
        setRole(selectedRole);
        closeRoleDialog();
    };

    return (
        <div>
            <Navbar HomePermission={true} IAMPermission={true} />
            <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
                <h1>Create New User</h1>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label>Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>
                    <div>
                        <label>Username:</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="e.g., user"
                                style={{
                                    flex: "1",
                                    padding: "8px",
                                    marginTop: "5px",
                                    borderTopRightRadius: "0",
                                    borderBottomRightRadius: "0",
                                }}
                            />
                            <span
                                style={{
                                    padding: "8px",
                                    backgroundColor: "#f0f0f0",
                                    border: "1px solid #ccc",
                                    borderLeft: "none",
                                    borderTopRightRadius: "4px",
                                    borderBottomRightRadius: "4px",
                                    color: "#888",
                                }}
                            >
                                @{domain}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </div>
                    <div>
                        <label>Role:</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="text"
                                value={role}
                                readOnly
                                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                            />
                            <button
                                type="button"
                                onClick={openRoleDialog}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#007BFF",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Select Role
                            </button>
                        </div>
                    </div>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}
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
                        Create User
                    </button>
                </form>
            </div>

            {roleDialogOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "8px",
                            width: "400px",
                        }}
                    >
                        <h2>Select a Role</h2>
                        <ul style={{ listStyle: "none", padding: "0" }}>
                            {roles.map((roleName) => (
                                <li
                                    key={roleName}
                                    style={{
                                        padding: "10px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid #ddd",
                                    }}
                                    onClick={() => selectRole(roleName)}
                                >
                                    {roleName}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={closeRoleDialog}
                            style={{
                                marginTop: "10px",
                                padding: "8px 16px",
                                backgroundColor: "#FF0000",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateNewUser;