import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";
import RoleChangeDialog from "../components/roleChangeDialog";

function IAM() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            console.error("No cookie found in localStorage.");
            setError(true);
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

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
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedUser(null);
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
                    <h2>Users</h2>
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
                <RoleChangeDialog
                    user={selectedUser}
                    onClose={handleDialogClose}
                />
            )}
        </div>
    );
}

export default IAM;