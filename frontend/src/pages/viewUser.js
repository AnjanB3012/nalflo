import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
        // Placeholder function for adding to group
        console.log("Add to group requested for user:", user.userName);
    };

    const handleGroupRemove = (groupName) => {
        // Placeholder function for removing from group
        console.log("Remove from group requested for user:", user.userName, "group:", groupName);
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
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{user.name || "No Name"}</h1>
                <p className="text-gray-600 text-lg">{user.userName}</p>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Role: {user.roleInfo}</h2>
                    <button 
                        onClick={handleRoleChange}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Change Role
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Groups</h2>
                    <button 
                        onClick={handleGroupAdd}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Add to Group
                    </button>
                </div>
                
                <div className="space-y-2">
                    {user.groups && user.groups.map((group, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                            <span>{group}</span>
                            <button 
                                onClick={() => handleGroupRemove(group)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {dialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-semibold mb-4">Change Role for {user.name}</h2>
                        {statusMessage && (
                            <div className={`p-3 mb-4 rounded ${
                                statusMessage.includes("success") 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-red-100 text-red-700"
                            }`}>
                                {statusMessage}
                            </div>
                        )}
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="">Select a role</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
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
                                onClick={handleSaveRoleChange}
                                disabled={!newRole || isLoading}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewUser;