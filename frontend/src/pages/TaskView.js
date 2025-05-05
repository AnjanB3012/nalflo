import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import '../styles/TaskView.css';

function TaskView() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [error, setError] = useState('');
    const [showAssignUsers, setShowAssignUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);

    useEffect(() => {
        const fetchTask = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try {
                const response = await fetch("http://localhost:8080/api/home/getUserTasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const data = await response.json();
                if (data.message === "Success") {
                    const foundTask = data.tasks.find(t => t.taskId === parseInt(taskId));
                    if (foundTask) {
                        setTask(foundTask);
                    } else {
                        setError("Task not found");
                    }
                }
            } catch (error) {
                console.error("Error fetching task:", error);
                setError("Failed to fetch task");
            }
        };

        fetchTask();
    }, [taskId, navigate]);

    const handleCloseTask = async () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError("Session expired. Please login again.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const response = await fetch("http://localhost:8080/api/home/closeTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    task_id: taskId
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                navigate('/');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error closing task:", error);
            setError("Failed to close task. Please try again.");
        }
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
            }
        } catch (error) {
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
                    task_id: taskId,
                    new_assignees: selectedUsers
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                setShowAssignUsers(false);
                setSelectedUsers([]);
                // Refresh task data
                const taskResponse = await fetch("http://localhost:8080/api/home/getUserTasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const taskData = await taskResponse.json();
                if (taskData.message === "Success") {
                    const foundTask = taskData.tasks.find(t => t.taskId === parseInt(taskId));
                    if (foundTask) {
                        setTask(foundTask);
                    }
                }
            }
        } catch (error) {
            console.error("Error assigning users:", error);
        }
    };

    if (!task) {
        return (
            <div className="task-view-container">
                <Navbar />
                <div className="main-content">
                    {error ? <div className="error-message">{error}</div> : <div>Loading...</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="task-view-container">
            <Navbar />
            <div className="main-content">
                {error && <div className="error-message">{error}</div>}
                <div className="task-details-card">
                    <div className="task-header">
                        <h1>{task.title}</h1>
                        <span className={`status-badge ${task.status ? 'open' : 'closed'}`}>
                            {task.status ? 'Open' : 'Closed'}
                        </span>
                    </div>
                    <div className="task-info">
                        <p><strong>Description:</strong> {task.description}</p>
                        <p><strong>Created by:</strong> {task.creatorUser?.userName || 'Unknown'}</p>
                        <p><strong>Created on:</strong> {new Date(task.creationTimeStamp).toLocaleString()}</p>
                        <p><strong>Assigned to:</strong> {task.assignedUsers?.map(user => user.userName).join(', ') || 'None'}</p>
                    </div>
                    {task.status && (
                        <div className="task-actions">
                            <button className="close-button" onClick={handleCloseTask}>
                                Close Task
                            </button>
                            <button className="assign-button" onClick={handleAssignUsers}>
                                Assign Users
                            </button>
                        </div>
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
        </div>
    );
}

export default TaskView; 