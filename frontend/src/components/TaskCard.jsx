import React, { useState } from 'react';
import '../styles/TaskCard.css';

function TaskCard({ task, onDelete, onClose, onAssignUsers, currentUser }) {
    const [showAssignUsers, setShowAssignUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [error, setError] = useState('');

    const getStatusDisplay = (status) => {
        return status ? 'Open' : 'Closed';
    };

    const getStatusClass = (status) => {
        return status ? 'open' : 'closed';
    };

    const handleAssignUsers = async () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) return;

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const response = await fetch("http://localhost:8080/api/home/getAssignableUsersToTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: cookieToken }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                const currentUser = parsedCookie.username;
                const filteredUsers = data.users.filter(user => user.userName !== currentUser);
                setAssignableUsers(filteredUsers);
                setShowAssignUsers(true);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError("Error fetching assignable users");
            console.error("Error fetching assignable users:", error);
        }
    };

    const handleAssignSubmit = async () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) return;

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const response = await fetch("http://localhost:8080/api/home/assignUsersToTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    task_id: task.taskId,
                    new_assignees: selectedUsers
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                setShowAssignUsers(false);
                setSelectedUsers([]);
                onAssignUsers();
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError("Error assigning users");
            console.error("Error assigning users:", error);
        }
    };

    return (
        <div className="task-card">
            {error && <div className="error-message">{error}</div>}
            <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`status-badge ${getStatusClass(task.status)}`}>
                    {getStatusDisplay(task.status)}
                </span>
            </div>
            <div className="task-details">
                <p><strong>Description:</strong> {task.description}</p>
                <p><strong>Created by:</strong> {task.creatorUser?.userName || 'Unknown'}</p>
                <p><strong>Created on:</strong> {new Date(task.creationTimeStamp).toLocaleString()}</p>
                <p><strong>Assigned to:</strong> {task.assignedUsers?.map(user => user.userName).join(', ') || 'None'}</p>
            </div>
            <div className="task-actions">
                {task.creatorUser?.userName === currentUser && (
                    <button className="delete-button" onClick={() => onDelete(task.taskId)}>
                        Delete Task
                    </button>
                )}
                {task.status && (
                    <>
                        <button className="close-button" onClick={() => onClose(task.taskId)}>
                            Close Task
                        </button>
                        <button className="assign-button" onClick={handleAssignUsers}>
                            Assign Users
                        </button>
                    </>
                )}
            </div>

            {showAssignUsers && (
                <div className="assign-users-modal">
                    <div className="assign-users-content">
                        <h3>Assign Users to Task</h3>
                        <div className="users-list">
                            {assignableUsers.map(user => (
                                <div key={user.userName} className="user-checkbox">
                                    <input
                                        type="checkbox"
                                        id={user.userName}
                                        checked={selectedUsers.includes(user.userName)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedUsers([...selectedUsers, user.userName]);
                                            } else {
                                                setSelectedUsers(selectedUsers.filter(u => u !== user.userName));
                                            }
                                        }}
                                    />
                                    <label htmlFor={user.userName}>{user.name}</label>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowAssignUsers(false)}>Cancel</button>
                            <button onClick={handleAssignSubmit}>Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskCard; 