import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";
import "../styles/iam.css";

function ViewGroup() {
    const { groupTitle } = useParams();
    const [group, setGroup] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookieToken, setCookieToken] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Get cookie token from local storage
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            setErrorMessage("Please log in to view group details");
            return;
        }

        try {
            const parsedCookie = JSON.parse(cookieData);
            setCookieToken(parsedCookie.token);

            // Fetch all users
            fetch("http://localhost:8080/api/iam/getUsers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: parsedCookie.token }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message === "Success") {
                        // Store the full user objects
                        setUsers(data.users);
                        setFilteredUsers(data.users);
                    } else {
                        console.error("Failed to fetch users:", data.message);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching users:", err);
                });
        } catch (e) {
            setError(true);
            setErrorMessage("Invalid session. Please log in again");
            return;
        }
    }, []);

    useEffect(() => {
        // Filter users based on search query
        const filtered = users.filter(user => 
            user && user.userName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    useEffect(() => {
        if (!cookieToken) return;
        
        fetch("http://localhost:8080/api/iam/viewGroup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                group_title: groupTitle,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Success") {
                console.log("Group data:", data.group); // Debug log
                setGroup(data.group);
            } else {
                setError(true);
                setErrorMessage(data.message);
            }
        })
        .catch((err) => {
            console.error("Error fetching group:", err); // Debug log
            setError(true);
            setErrorMessage("Error fetching group details");
        });
    }, [cookieToken, groupTitle]);

    const handleAddUserClick = () => {
        setSelectedUser("");
        setStatusMessage("");
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedUser("");
        setStatusMessage("");
    };

    const handleAddUser = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        if (!selectedUser) {
            setStatusMessage("Please select a user");
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
                    group_title: groupTitle,
                    user_name: selectedUser,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh group data
                const groupResponse = await fetch("http://localhost:8080/api/iam/viewGroup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        group_title: groupTitle,
                    }),
                });
                const groupData = await groupResponse.json();
                if (groupData.message === "Success") {
                    setGroup(groupData.group);
                }
                setStatusMessage("User added successfully!");
                setTimeout(() => {
                    handleDialogClose();
                    setStatusMessage("");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to add users to groups");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while adding the user");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUser = async (user) => {
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
                    group_title: groupTitle,
                    user_name: user,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                // Refresh group data
                const groupResponse = await fetch("http://localhost:8080/api/iam/viewGroup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cookie_token: cookieToken,
                        group_title: groupTitle,
                    }),
                });
                const groupData = await groupResponse.json();
                if (groupData.message === "Success") {
                    setGroup(groupData.group);
                }
                setStatusMessage("User removed successfully!");
                setTimeout(() => setStatusMessage(""), 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to remove users from groups");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage("An error occurred while removing the user");
            }
        } catch (error) {
            console.error("Error removing user:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!cookieToken) {
            setStatusMessage("No session found. Please log in again.");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        setIsLoading(true);
        setStatusMessage("Deleting group...");

        try {
            const response = await fetch("http://localhost:8080/api/iam/deleteGroup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    group_title: groupTitle,
                }),
            });

            const data = await response.json();

            if (data.message === "Success") {
                setStatusMessage("Group deleted successfully!");
                setTimeout(() => {
                    navigate("/iam");
                }, 1500);
            } else if (data.message === "Permission Denied") {
                setStatusMessage("You don't have permission to delete groups");
            } else if (data.message === "Failed") {
                setStatusMessage("Session expired. Please log in again");
                localStorage.removeItem("local_cookie");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatusMessage(data.message || "An error occurred while deleting the group");
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            setStatusMessage("Failed to connect to the server");
        } finally {
            setIsLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    if (error) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{errorMessage}</span>
                </div>
            </div>
        );
    }

    if (!group) {
        return <div className="p-6 max-w-2xl mx-auto">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{group.title}</h1>
                        <p className="text-gray-600 text-lg">{group.description}</p>
                    </div>
                    <button
                        onClick={() => setDeleteDialogOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        disabled={isLoading}
                    >
                        Delete Group
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Users in Group</h2>
                    <button
                        onClick={handleAddUserClick}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Add User
                    </button>
                </div>
                <div className="space-y-2">
                    {group.users && group.users.length > 0 ? (
                        group.users.map((username, index) => (
                            <div key={`user-${username}-${index}`} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                                <div>
                                    <span className="font-semibold">{username}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveUser(username)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    disabled={isLoading}
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    ) : (
                        <div key="no-users" className="text-gray-500 text-center py-4">
                            No users in this group
                        </div>
                    )}
                </div>
            </div>

            {dialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-semibold mb-4">Add User to {group.title}</h2>
                        {statusMessage && (
                            <div key="status-message" className={`p-3 mb-4 rounded ${
                                statusMessage.includes("success") 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-red-100 text-red-700"
                            }`}>
                                {statusMessage}
                            </div>
                        )}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option key="default" value="">Select a user</option>
                            {filteredUsers && filteredUsers.length > 0 ? (
                                filteredUsers
                                    .map((user, index) => (
                                        <option 
                                            key={`option-${user.userName}-${index}`} 
                                            value={user.userName}
                                        >
                                            {user.userName} {user.name ? `(${user.name})` : ''}
                                        </option>
                                    ))
                            ) : (
                                <option key="no-users-available" value="" disabled>No users available</option>
                            )}
                        </select>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleDialogClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={!selectedUser || isLoading}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-semibold mb-4">Delete Group</h2>
                        <p className="mb-4">Are you sure you want to delete the group "{group.title}"? This action cannot be undone.</p>
                        {statusMessage && (
                            <div className={`p-3 mb-4 rounded ${
                                statusMessage.includes("success") 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-red-100 text-red-700"
                            }`}>
                                {statusMessage}
                            </div>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setDeleteDialogOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Deleting..." : "Delete Group"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewGroup;