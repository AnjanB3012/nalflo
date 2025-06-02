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
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyDescription, setReplyDescription] = useState('');
    const [parsedCookie, setParsedCookie] = useState(null);

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (cookieData) {
            setParsedCookie(JSON.parse(cookieData));
        }
    }, []);

    useEffect(() => {
        const fetchTask = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            setParsedCookie(parsedCookie);
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
                setSelectedUsers(task.assignedUsers.map(user => user.userName));
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

    const handleReply = async () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError("Session expired. Please login again.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            // First get assignable users
            const assignableResponse = await fetch("http://localhost:8080/api/home/getAssignableUsersToTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cookie_token: cookieToken }),
            });
            const assignableData = await assignableResponse.json();
            
            if (assignableData.message === "Success") {
                // Get current task's assignees
                const currentAssignees = task.assignedUsers.map(user => user.userName);
                
                // Filter out current user from assignable users
                const filteredUsers = assignableData.users.filter(user => user.userName !== parsedCookie.username);
                
                // Set assignable users
                setAssignableUsers(filteredUsers);
                
                // Initialize selected users with current task's assignees
                setSelectedUsers(currentAssignees);
                
                // Show reply modal
                setShowReplyModal(true);
            }
        } catch (error) {
            console.error("Error preparing reply:", error);
            setError("Failed to prepare reply");
        }
    };

    const handleReplySubmit = async () => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError("Session expired. Please login again.");
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            // Create the reply task
            const createResponse = await fetch("http://localhost:8080/api/home/createNewTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    task_title: task.title.startsWith("Reply to:") ? task.title : `Reply to: ${task.title}`,
                    task_description: replyDescription,
                    task_assignees: selectedUsers,
                    previous_task_id: taskId
                }),
            });
            const createData = await createResponse.json();
            if (createData.message === "Success") {
                // Close the modal and reset state
                setShowReplyModal(false);
                setReplyDescription('');
                setSelectedUsers([]);
                
                // Navigate back to home page
                navigate('/');
            } else {
                setError(createData.message || "Failed to create reply task");
            }
        } catch (error) {
            console.error("Error creating reply task:", error);
            setError("Failed to create reply task");
        }
    };

    // Add useEffect to initialize selected users when opening reply modal
    useEffect(() => {
        if (showReplyModal && task) {
            // Initialize with current task's assignees
            setSelectedUsers(task.assignedUsers.map(user => user.userName));
        }
    }, [showReplyModal, task]);

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
                            {(task.creatorUser?.userName === parsedCookie?.username || 
                              task.assignedUsers?.some(user => user.userName === parsedCookie?.username)) && (
                                <button className="close-button" onClick={handleCloseTask}>
                                    Close Task
                                </button>
                            )}
                            <button className="reply-button" onClick={handleReply}>
                                Reply
                            </button>
                        </div>
                    )}
                </div>

                {task.previousTask && task.previousTask.length > 0 && (
                    <div className="previous-tasks-section">
                        <h2>Previous Tasks</h2>
                        {task.previousTask.map(prevTask => (
                            <div key={prevTask.taskId} className="previous-task-card">
                                <h3>{prevTask.title}</h3>
                                <p><strong>Description:</strong> {prevTask.description}</p>
                                <p><strong>Created by:</strong> {prevTask.creatorUser?.userName || 'Unknown'}</p>
                                <p><strong>Created on:</strong> {new Date(prevTask.creationTimeStamp).toLocaleString()}</p>
                                <p><strong>Status:</strong> {prevTask.status ? 'Open' : 'Closed'}</p>
                            </div>
                        ))}
                    </div>
                )}

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

                {showReplyModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div className="modal-content" style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '80%',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}>
                            <h2>Reply to Task</h2>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={replyDescription}
                                    onChange={(e) => setReplyDescription(e.target.value)}
                                    placeholder="Enter your reply..."
                                    required
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        marginTop: '8px',
                                        padding: '8px'
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Assign to:</label>
                                <div className="assignable-users-list" style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '8px'
                                }}>
                                    {assignableUsers.map(user => {
                                        const isCurrentAssignee = task.assignedUsers.some(
                                            assignedUser => assignedUser.userName === user.userName
                                        );
                                        const isAssignable = selectedUsers.includes(user.userName);
                                        const canUnassign = assignableUsers.some(
                                            assignableUser => assignableUser.userName === user.userName
                                        );
                                        
                                        return (
                                            <div key={user.userName} className="user-assignment-item" style={{
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    cursor: canUnassign ? 'pointer' : 'not-allowed'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAssignable}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedUsers([...selectedUsers, user.userName]);
                                                            } else {
                                                                setSelectedUsers(selectedUsers.filter(u => u !== user.userName));
                                                            }
                                                        }}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <span>
                                                        {user.userName}
                                                        {isCurrentAssignee && " (Current Assignee)"}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="modal-actions" style={{
                                marginTop: '20px',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '10px'
                            }}>
                                <button 
                                    onClick={() => {
                                        setShowReplyModal(false);
                                        setReplyDescription('');
                                        setSelectedUsers([]);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleReplySubmit}
                                    disabled={!replyDescription.trim()}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: !replyDescription.trim() ? '#ccc' : '#007bff',
                                        color: 'white',
                                        cursor: !replyDescription.trim() ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Submit Reply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskView; 