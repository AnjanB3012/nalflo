import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { Select, MenuItem } from "@mui/material";
import { TextField } from "@mui/material";

function ViewUser() {
    const { userName } = useParams();
    const [user, setUser] = useState({});
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookieToken, setCookieToken] = useState(null);
    const [roles, setRoles] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [groups, setGroups] = useState([]);
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Get cookie token from local storage
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            setErrorMessage("Please log in to view user details");
            return;
        }

        try {
            const parsedCookie = JSON.parse(cookieData);
            setCookieToken(parsedCookie.token);

            // Fetch roles
            fetch("http://localhost:8080/api/iam/getAllRoleNames", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: parsedCookie.token }),
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

            // Fetch groups
            fetch("http://localhost:8080/api/iam/getAllGroups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: parsedCookie.token }),
            })
                .then((response) => response.json())
                .then((groupData) => {
                    if (groupData.message === "Success") {
                        setGroups(groupData.groups);
                    } else {
                        console.error("Failed to fetch groups:", groupData.message);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching groups:", err);
                });
        } catch (e) {
            setError(true);
            setErrorMessage("Invalid session. Please log in again");
            return;
        }
    }, []);

    useEffect(() => {
        if (!cookieToken) return; // Don't make the API call if we don't have a token

        console.log("Making request with:", {
            cookie_token: cookieToken,
            target_username: userName
        });

        fetch("http://localhost:8080/api/iam/viewUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                target_username: userName,
            }),
        })
        .then((response) => {
            console.log("Response status:", response.status);
            return response.json();
        })
        .then((data) => {
            console.log("API Response:", data);
            if (data.message === "Success") {
                setUser(data.user);
            }
            else if (data.message === "Permission Denied") {
                setErrorMessage("You don't have permission to view user details");
                setError(true);
            }
            else if (data.message === "Failed") {
                setErrorMessage("Your session has expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
                setError(true);
            }
            else if (data.message === "User not found") {
                setErrorMessage(`User "${userName}" does not exist`);
                setError(true);
            }
            else {
                setErrorMessage("An unexpected error occurred");
                setError(true);
            }
        })
        .catch((error) => {
            console.error("Error fetching user:", error);
            setErrorMessage("Failed to connect to the server");
            setError(true);
        });
    }, [userName, cookieToken, navigate]);

    const handleRoleChange = () => {
        setNewRole(user.roleInfo || ""); // Preselect current role
        setStatusMessage("");
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setNewRole("");
        setStatusMessage("");
    };

    const handleSaveRoleChange = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        if (!newRole) {
            setStatusMessage("Please select a role");
            return;
        }

        setIsLoading(true);
        setStatusMessage("Updating role...");

        try {
            const response = await fetch("http://localhost:8080/api/iam/changeUserRole", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    target_username: userName,
                    new_role_name: newRole,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setUser({ ...user, roleInfo: newRole });
                setStatusMessage("Role updated successfully!");
                setTimeout(() => {
                    handleDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to change roles");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while updating the role");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGroupAdd = () => {
        setSelectedGroup("");
        setStatusMessage("");
        setGroupDialogOpen(true);
    };

    const handleGroupDialogClose = () => {
        setGroupDialogOpen(false);
        setSelectedGroup("");
        setStatusMessage("");
    };

    const handleSaveGroupAdd = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        if (!selectedGroup) {
            setStatusMessage("Please select a group");
            return;
        }

        setIsLoading(true);
        setStatusMessage("Adding user to group...");

        try {
            const response = await fetch("http://localhost:8080/api/iam/addUserToGroup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    group_title: selectedGroup,
                    user_name: userName,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh user data
                const userResponse = await fetch("http://localhost:8080/api/iam/viewUser", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        target_username: userName,
                    }),
                });
                const userData = await userResponse.json();
                if (userData.message === "Success") {
                    setUser(userData.user);
                }
                setStatusMessage("User added to group successfully!");
                setTimeout(() => {
                    handleGroupDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to add users to groups");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while adding the user to the group");
            }
        } catch (error) {
            console.error("Error adding user to group:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGroupRemove = async (groupName) => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        setIsLoading(true);
        setStatusMessage("Removing user from group...");

        try {
            const response = await fetch("http://localhost:8080/api/iam/removeUserFromGroup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    group_title: groupName,
                    user_name: userName,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh user data
                const userResponse = await fetch("http://localhost:8080/api/iam/viewUser", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        target_username: userName,
                    }),
                });
                const userData = await userResponse.json();
                if (userData.message === "Success") {
                    setUser(userData.user);
                }
                setStatusMessage("User removed from group successfully!");
                setTimeout(() => setStatusMessage(""), 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to remove users from groups");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while removing the user from the group");
            }
        } catch (error) {
            console.error("Error removing user from group:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = () => {
        setNewPassword("");
        setStatusMessage("");
        setPasswordDialogOpen(true);
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialogOpen(false);
        setNewPassword("");
        setStatusMessage("");
    };

    const handleSavePasswordChange = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        if (!newPassword) {
            setStatusMessage("Please enter a new password");
            return;
        }

        setIsLoading(true);
        setStatusMessage("Updating password...");

        try {
            const response = await fetch("http://localhost:8080/api/iam/changeUserPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    target_username: userName,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setStatusMessage("Password updated successfully!");
                setTimeout(() => {
                    handlePasswordDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to change user passwords");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else if (data.message === "User not found") {
                setStatusMessage("User not found");
            } else {
                setStatusMessage("An error occurred while updating the password");
            }
        } catch (error) {
            console.error("Error updating password:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{errorMessage}</span>
            </div>
        </div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h1 className="text-2xl font-bold mb-4">User Details</h1>
                {user && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
                            <p className="text-gray-900">{user.userName}</p>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                            <p className="text-gray-900">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Role:</label>
                            <div className="flex items-center space-x-2">
                                <p className="text-gray-900">{user.roleInfo}</p>
                                <button
                                    onClick={handleRoleChange}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                                >
                                    Change Role
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                            <div className="flex items-center space-x-2">
                                <p className="text-gray-900">••••••••</p>
                                <button
                                    onClick={handlePasswordChange}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Groups:</label>
                            <div className="space-y-2">
                                {user.groups && user.groups.map((group, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <p className="text-gray-900">{group}</p>
                                        <button
                                            onClick={() => handleGroupRemove(group)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleGroupAdd}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                                >
                                    Add to Group
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Role Change Dialog */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select a new role for the user:
                    </DialogContentText>
                    <Select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        fullWidth
                    >
                        {roles.map((role) => (
                            <MenuItem key={role} value={role}>
                                {role}
                            </MenuItem>
                        ))}
                    </Select>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleSaveRoleChange} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Password Change Dialog */}
            <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
                <DialogTitle>Change User Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Enter a new password for the user:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePasswordDialogClose}>Cancel</Button>
                    <Button onClick={handleSavePasswordChange} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Group Add Dialog */}
            <Dialog open={groupDialogOpen} onClose={handleGroupDialogClose}>
                <DialogTitle>Add User to Group</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select a group to add the user to:
                    </DialogContentText>
                    <Select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        fullWidth
                    >
                        {groups.map((group) => (
                            <MenuItem key={group.title} value={group.title}>
                                {group.title}
                            </MenuItem>
                        ))}
                    </Select>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleGroupDialogClose}>Cancel</Button>
                    <Button onClick={handleSaveGroupAdd} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {statusMessage && (
                <div className="mt-4">
                    <div className={`p-4 rounded ${
                        statusMessage.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                        {statusMessage}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewUser;