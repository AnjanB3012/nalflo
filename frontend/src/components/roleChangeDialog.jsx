import { useEffect, useState } from "react";

function RoleChangeDialog({ user, onClose }) {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(user.roleInfo);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            console.error("No cookie found in localStorage.");
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
                    console.error("Failed to fetch roles:", data.message);
                }
            })
            .catch((err) => {
                console.error("Error fetching roles:", err);
            });
    }, []);

    const handleSave = () => {
        if (selectedRole === user.roleInfo) {
            onClose();
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            console.error("No cookie found in localStorage.");
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
                target_username: user.userName,
                new_role_name: selectedRole,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    console.log("Role updated successfully.");
                } else {
                    console.error("Failed to update role:", data.message);
                }
                onClose();
            })
            .catch((err) => {
                console.error("Error updating role:", err);
                onClose();
            });
    };

    const filteredRoles = roles.filter((role) =>
        role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dialog-overlay">
            <div className="dialog-box">
                <h2>Change Role for {user.userName}</h2>
                <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="role-list">
                    {filteredRoles.map((role) => (
                        <div key={role}>
                            <input
                                type="radio"
                                id={role}
                                name="role"
                                value={role}
                                checked={selectedRole === role}
                                onChange={() => setSelectedRole(role)}
                            />
                            <label htmlFor={role}>{role}</label>
                        </div>
                    ))}
                </div>
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}

export default RoleChangeDialog;