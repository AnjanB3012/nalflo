import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ViewRole() {
    const { roleTitle } = useParams();
    const [role, setRole] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookieToken, setCookieToken] = useState(null);
    const [editingPermissions, setEditingPermissions] = useState(false);
    const [tempPermissions, setTempPermissions] = useState({});

    useEffect(() => {
        // Get cookie token from local storage
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            setErrorMessage("Please log in to view role details");
            return;
        }

        try {
            const parsedCookie = JSON.parse(cookieData);
            setCookieToken(parsedCookie.token);
        } catch (e) {
            setError(true);
            setErrorMessage("Invalid session. Please log in again");
            return;
        }
    }, []);

    useEffect(() => {
        if (!cookieToken) return;

        fetch("http://localhost:8080/api/iam/viewRole", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                role_name: roleTitle,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Success") {
                setRole(data.role);
                setTempPermissions(data.role.permissions);
            }
            else if (data.message === "Permission Denied") {
                setErrorMessage("You don't have permission to view role details");
                setError(true);
            }
            else if (data.message === "Role not found") {
                setErrorMessage(`Role "${roleTitle}" does not exist`);
                setError(true);
            }
            else {
                setErrorMessage("An unexpected error occurred");
                setError(true);
            }
        })
        .catch((error) => {
            console.error("Error fetching role:", error);
            setErrorMessage("Failed to connect to the server");
            setError(true);
        });
    }, [roleTitle, cookieToken]);

    const handleEditPermissions = () => {
        setEditingPermissions(true);
    };

    const handleSavePermissions = () => {
        fetch("http://localhost:8080/api/iam/updateRolePermissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                role_name: roleTitle,
                permissions: tempPermissions,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Success") {
                setRole({ ...role, permissions: tempPermissions });
                setEditingPermissions(false);
            } else {
                setErrorMessage("Failed to update permissions");
                setError(true);
            }
        })
        .catch((error) => {
            console.error("Error updating permissions:", error);
            setErrorMessage("Failed to connect to the server");
            setError(true);
        });
    };

    const handleCancelEdit = () => {
        setTempPermissions(role.permissions);
        setEditingPermissions(false);
    };

    const handlePermissionChange = (permission) => {
        setTempPermissions({
            ...tempPermissions,
            [permission]: !tempPermissions[permission],
        });
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

    if (!role) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{role.roleTitle}</h1>
                <p className="text-gray-600 text-lg">{role.roleDescription}</p>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Permissions</h2>
                    {!editingPermissions ? (
                        <button
                            onClick={handleEditPermissions}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Edit Permissions
                        </button>
                    ) : (
                        <div>
                            <button
                                onClick={handleSavePermissions}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    {Object.entries(editingPermissions ? tempPermissions : role.permissions).map(([permission, value]) => (
                        <div key={permission} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                            <span className="capitalize">{permission}</span>
                            {editingPermissions ? (
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={() => handlePermissionChange(permission)}
                                    className="w-5 h-5"
                                />
                            ) : (
                                <span className={value ? "text-green-600" : "text-red-600"}>
                                    {value ? "Enabled" : "Disabled"}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Users with this Role</h2>
                <div className="space-y-2">
                    {role.users.map((user) => (
                        <div key={user.userName} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                            <div>
                                <span className="font-semibold">{user.name}</span>
                                <span className="text-gray-600 ml-2">({user.userName})</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ViewRole; 