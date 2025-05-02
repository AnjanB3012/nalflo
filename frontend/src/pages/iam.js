import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";

function IAM() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            console.error("No cookie found in localStorage.");
            setError(true);
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        // Fetch permissions
        fetch("http://localhost:8080/api/getUserPermissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cookie_token: cookieToken }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    setPermissions(data.permissions);

                    if (data.permissions && data.permissions.iam) {
                        // Fetch users
                        fetch("http://localhost:8080/api/iam/getUsers", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ cookie_token: cookieToken }),
                        })
                            .then((response) => response.json())
                            .then((userData) => {
                                if (userData.message === "Success") {
                                    setUsers(userData.users);
                                } else {
                                    console.error("Failed to fetch users:", userData.message);
                                    setError(true);
                                }
                            })
                            .catch((err) => {
                                console.error("Error fetching users:", err);
                                setError(true);
                            });

                        // Fetch roles
                        fetch("http://localhost:8080/api/iam/getAllRoleNames", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ cookie_token: cookieToken }),
                        })
                            .then((response) => response.json())
                            .then((roleData) => {
                                if (roleData.message === "Success") {
                                    setRoles(roleData.roles);
                                } else {
                                    console.error("Failed to fetch roles:", roleData.message);
                                }
                            })
                            .catch((err) => {
                                console.error("Error fetching roles:", err);
                            });
                    } else {
                        console.error("IAM permission is missing or false.");
                        setError(true);
                    }
                } else {
                    console.error("Failed to fetch permissions:", data.message);
                    setError(true);
                }
            })
            .catch((err) => {
                console.error("Error fetching permissions:", err);
                setError(true);
            });
    }, []);

    const handleRoleChangeClick = (user) => {
        setSelectedUser(user);
        setNewRole(user.roleInfo); // Preselect the user's current role
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedUser(null);
        setNewRole("");
    };

    const handleSaveRoleChange = () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            console.error("No cookie found. Please log in.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        fetch("http://localhost:8080/api/iam/changeUserRole", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                target_username: selectedUser.userName,
                new_role_name: newRole,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    alert("Role updated successfully!");
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.userName === selectedUser.userName
                                ? { ...user, roleInfo: newRole }
                                : user
                        )
                    );
                    handleDialogClose();
                } else {
                    console.error("Failed to update role:", data.message);
                }
            })
            .catch((err) => {
                console.error("Error updating role:", err);
            });
    };

    const handleCreateNewUserClick = () => {
        navigate("/createNewUser");
    };

    if (error) {
        return <ErrorPage />;
    }

    return (
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <h1>Welcome to the IAM Page</h1>
            <div className="card-container">
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2>Users</h2>
                        <button
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#007BFF",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={handleCreateNewUserClick}
                        >
                            Create New User
                        </button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.userName}>
                                    <td>{user.userName}</td>
                                    <td>{user.name}</td>
                                    <td>{user.roleInfo}</td>
                                    <td>
                                        <button onClick={() => handleRoleChangeClick(user)}>Change Role</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {dialogOpen && (
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
                        <h2>Change Role for {selectedUser?.name}</h2>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <button
                                onClick={handleSaveRoleChange}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#007BFF",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={handleDialogClose}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#FF0000",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IAM;