import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";
import "../styles/iam.css";

function IAM() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
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
                    
                    // Fetch users
                    const usersResponse = await fetch("http://localhost:8080/api/iam/getUsers", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const usersData = await usersResponse.json();
                    if (usersData.message === "Success") {
                        setUsers(usersData.users);
                    } else {
                        setError(true);
                        setErrorMessage("Failed to fetch users: " + usersData.message);
                    }

                    // Fetch roles
                    const rolesResponse = await fetch("http://localhost:8080/api/iam/getRoles", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const rolesData = await rolesResponse.json();
                    if (rolesData.message === "Success") {
                        setRoles(rolesData.roles);
                    } else {
                        setError(true);
                        setErrorMessage("Failed to fetch roles: " + rolesData.message);
                    }

                    // Fetch groups
                    const groupsResponse = await fetch("http://localhost:8080/api/iam/getAllGroups", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const groupsData = await groupsResponse.json();
                    if (groupsData.message === "Success") {
                        setGroups(groupsData.groups);
                    } else {
                        setError(true);
                        setErrorMessage("Failed to fetch groups: " + groupsData.message);
                    }
                } else {
                    setError(true);
                    setErrorMessage("Failed to fetch permissions: " + data.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(true);
                setErrorMessage("Failed to connect to the server");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

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
        return (
            <div className="iam-container">
                <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} />
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
                <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} />
                <div className="loading-message">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
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