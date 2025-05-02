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
        iam: false
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
                <div className="p-6 max-w-2xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{errorMessage}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <div className="p-6 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Create New Role</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role Name</label>
                        <input
                            type="text"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter role name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter role description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                        <div className="space-y-2">
                            {Object.entries(rolePermissions).map(([permission, value]) => (
                                <div key={permission} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handlePermissionChange(permission)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900 capitalize">
                                        {permission}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate("/iam")}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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