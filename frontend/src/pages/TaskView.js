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
    const [taskTimeline, setTaskTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to recursively fetch all previous tasks
    const fetchTaskChain = async (taskId, cookieToken) => {
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
                const currentTask = data.tasks.find(t => t.taskId === parseInt(taskId));
                if (currentTask) {
                    setTask(currentTask);
                    const timeline = [currentTask];
                    let previousTask = currentTask.previousTask?.[0];
                    
                    while (previousTask) {
                        const prevTask = data.tasks.find(t => t.taskId === previousTask.taskId);
                        if (prevTask) {
                            timeline.unshift(prevTask);
                            previousTask = prevTask.previousTask?.[0];
                        } else {
                            break;
                        }
                    }
                    setTaskTimeline(timeline);
                } else {
                    setError("Task not found");
                }
            } else {
                setError(data.message || "Failed to fetch task");
            }
        } catch (error) {
            console.error("Error fetching task chain:", error);
            setError("Failed to fetch task history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            navigate('/login');
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        setParsedCookie(parsedCookie);
        fetchTaskChain(taskId, parsedCookie.token);
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

    if (loading) {
        return (
            <div className="task-view-container">
                <Navbar />
                <div className="main-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Loading task history...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-view-container">
                <Navbar />
                <div className="main-content">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="task-view-container">
            <Navbar />
            <div className="main-content">
                {/* Task Timeline */}
                <div className="task-timeline">
                    {taskTimeline.slice().reverse().map((task, index) => (
                        <div key={task.taskId} className={`timeline-task-card ${index === 0 ? 'current-task' : 'reply-task'}`}>
                            <div className="timeline-content">
                                <div className="task-header">
                                    <h3>{task.title}</h3>
                                    {index === 0 && (
                                        <span className={`status-badge ${task.status ? 'open' : 'closed'}`}>
                                            {task.status ? 'Open' : 'Closed'}
                                        </span>
                                    )}
                                </div>
                                <div className="task-info">
                                    <p><strong>Description:</strong> {task.description}</p>
                                    <p><strong>From:</strong> {task.creatorUser?.userName || 'Unknown'}</p>
                                    <p><strong>Date:</strong> {new Date(task.creationTimeStamp).toLocaleString()}</p>
                                    <p><strong>To:</strong> {(() => {
                                        const assignees = task.assignedUsers?.filter(user => user.userName !== task.creatorUser?.userName) || [];
                                        const creator = task.creatorUser?.userName;
                                        const assigneeList = assignees.map(user => user.userName);
                                        if (creator) {
                                            assigneeList.unshift(`${creator} (Creator)`);
                                        }
                                        return assigneeList.join(', ') || 'None';
                                    })()}</p>
                                </div>
                                {index === 0 && task.status && (
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
                        </div>
                    ))}
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

                {showReplyModal && (
                    <div className="reply-modal">
                        <div className="reply-content">
                            <h3>Reply to Task</h3>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={replyDescription}
                                    onChange={(e) => setReplyDescription(e.target.value)}
                                    placeholder="Enter your reply..."
                                    rows="4"
                                />
                            </div>
                            <div className="form-group">
                                <label>Assign to:</label>
                                <div className="assignable-users-list" style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '8px'
                                }}>
                                    {/* Show creator first */}
                                    <div className="user-assignment-item" style={{
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: '0.7'
                                    }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'not-allowed'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                disabled={true}
                                                style={{ marginRight: '8px' }}
                                            />
                                            <span>
                                                {task.creatorUser.userName} (Creator)
                                            </span>
                                        </label>
                                    </div>
                                    {/* Then show current assignees (excluding creator) */}
                                    {task.assignedUsers.map(user => {
                                        if (user.userName !== task.creatorUser.userName) {
                                            return (
                                                <div key={user.userName} className="user-assignment-item" style={{
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    opacity: '0.7'
                                                }}>
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'not-allowed'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={true}
                                                            disabled={true}
                                                            style={{ marginRight: '8px' }}
                                                        />
                                                        <span>
                                                            {user.userName} (Current Assignee)
                                                        </span>
                                                    </label>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                    {/* Then show assignable users */}
                                    {assignableUsers.map(user => {
                                        const isCurrentAssignee = task.assignedUsers.some(
                                            assignedUser => assignedUser.userName === user.userName
                                        );
                                        const isCreator = task.creatorUser.userName === user.userName;
                                        if (!isCurrentAssignee && !isCreator) {
                                            return (
                                                <div key={user.userName} className="user-assignment-item" style={{
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.userName)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedUsers([...selectedUsers, user.userName]);
                                                                } else {
                                                                    setSelectedUsers(selectedUsers.filter(u => u !== user.userName));
                                                                }
                                                            }}
                                                            style={{ marginRight: '8px' }}
                                                        />
                                                        <span>{user.userName}</span>
                                                    </label>
                                                </div>
                                            );
                                        }
                                        return null;
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
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        cursor: 'pointer'
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