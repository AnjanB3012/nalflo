import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";
import "../styles/iam.css";

function IAM() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [groups, setGroups] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            // Get permissions from localStorage or fetch them
            const storedPermissions = localStorage.getItem("user_permissions");
            if (storedPermissions) {
                setPermissions(JSON.parse(storedPermissions));
            } else {
                try {
                    const response = await fetch("http://localhost:8080/api/getUserPermissions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const data = await response.json();
                    if (data.message === "Success") {
                        setPermissions(data.permissions);
                        localStorage.setItem("user_permissions", JSON.stringify(data.permissions));
                    }
                } catch (error) {
                    console.error("Error fetching permissions:", error);
                    setError("Failed to fetch permissions");
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    useEffect(() => {
        if (permissions && permissions.iam) {
            // Fetch users
            fetch("http://localhost:8080/api/iam/getUsers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: permissions.token }),
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
            fetch("http://localhost:8080/api/iam/getRoles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: permissions.token }),
            })
                .then((response) => response.json())
                .then((rolesData) => {
                    if (rolesData.message === "Success") {
                        setRoles(rolesData.roles);
                    } else {
                        console.error("Failed to fetch roles:", rolesData.message);
                        setError(true);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching roles:", err);
                    setError(true);
                });

            // Fetch groups
            fetch("http://localhost:8080/api/iam/getAllGroups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: permissions.token }),
            })
                .then((response) => response.json())
                .then((groupsData) => {
                    if (groupsData.message === "Success") {
                        setGroups(groupsData.groups);
                    } else {
                        console.error("Failed to fetch groups:", groupsData.message);
                        setError(true);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching groups:", err);
                    setError(true);
                });
        }
    }, [permissions]);

    const handleCreateNewUserClick = () => {
        navigate("/createNewUser");
    };

    const handleViewUserClick = (userName) => {
        window.open(`/viewUser/${userName}`, '_blank', 'width=800,height=600');
    };

    const handleCreateNewRoleClick = () => {
        navigate("/createNewRole");
    };

    const handleViewRoleClick = (roleTitle) => {
        window.open(`/viewRole/${roleTitle}`, '_blank', 'width=800,height=600');
    };

    const handleViewGroupClick = (groupTitle) => {
        window.open(`/viewGroup/${groupTitle}`, '_blank', 'width=800,height=600');
    };

    const handleCreateNewGroupClick = () => {
        navigate("/createNewGroup");
    };

    if (error) {
        return <ErrorPage />;
    }

    return (
        <div className="iam-container">
            <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} />
            <h1 className="iam-title">Identity and Access Management</h1>
            <div className="card-container">
                {/* Users Section */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Users</h2>
                        <button
                            className="button button-primary"
                            onClick={handleCreateNewUserClick}
                        >
                            Create New User
                        </button>
                    </div>
                    <table className="iam-table">
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
                                        <button 
                                            onClick={() => handleViewUserClick(user.userName)}
                                            className="button button-success"
                                        >
                                            View User
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Roles Section */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Roles</h2>
                        <button
                            className="button button-primary"
                            onClick={handleCreateNewRoleClick}
                        >
                            Create New Role
                        </button>
                    </div>
                    <table className="iam-table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Users Count</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.roleTitle}>
                                    <td>{role.roleTitle}</td>
                                    <td>{role.roleDescription}</td>
                                    <td><span className="user-count">{role.users.length}</span></td>
                                    <td>
                                        <button 
                                            onClick={() => handleViewRoleClick(role.roleTitle)}
                                            className="button button-success"
                                        >
                                            View Role
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Groups Section */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Groups</h2>
                        <button
                            className="button button-primary"
                            onClick={handleCreateNewGroupClick}
                        >
                            Create New Group
                        </button>
                    </div>
                    <table className="iam-table">
                        <thead>
                            <tr>
                                <th>Group Name</th>
                                <th>Description</th>
                                <th>Users Count</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group.title}>
                                    <td>{group.title}</td>
                                    <td>{group.description}</td>
                                    <td><span className="user-count">{group.users.length}</span></td>
                                    <td>
                                        <button 
                                            onClick={() => handleViewGroupClick(group.title)}
                                            className="button button-success"
                                        >
                                            View Group
                                        </button>
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

export default IAM;