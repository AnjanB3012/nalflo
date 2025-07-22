import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/navbar.jsx';
import '../styles/createNewTask.css';
import { getApiBaseUrl } from '../utils/config.js';

function CreateNewTask() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState('');
    const [previousTask, setPreviousTask] = useState(null);
    const [noAIProcessing, setNoAIProcessing] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Check if we're replying to a task
        if (location.state?.previousTask) {
            setPreviousTask(location.state.previousTask);
            setTitle(`Re: ${location.state.previousTask.title}`);
            // Initialize selected users with current task's assignees
            setSelectedUsers(location.state.previousTask.assignedUsers);
        }

        const fetchAssignableUsers = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try {
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/home/getAssignableUsersToTask`, {
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
                } else {
                    setError(data.message);
                }
            } catch (error) {
                console.error("Error fetching assignable users:", error);
                setError("Failed to fetch assignable users");
            }
        };

        fetchAssignableUsers();
    }, [navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            navigate('/login');
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const apiBaseUrl = await getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/api/home/createNewTask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    task_title: title,
                    task_description: description,
                    task_assignees: selectedUsers,
                    previous_task_id: previousTask?.taskId,
                    no_ai_processing: noAIProcessing
                }),
            });
            const data = await response.json();
            if (data.message === "Success") {
                navigate('/');
            } else {
                setError(data.message || "Failed to create task");
            }
        } catch (error) {
            console.error("Error creating task:", error);
            setError("Failed to create task");
        }
    };

    return (
        <div className="create-task-container">
            <Navbar />
            <div className="main-content">
                <div className="create-task-card">
                    <h2>{previousTask ? 'Reply to Task' : 'Create New Task'}</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter task description"
                                required
                                rows="4"
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={noAIProcessing}
                                    onChange={e => setNoAIProcessing(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                Do NOT do AI processing on this task
                            </label>
                        </div>
                        <div className="form-group">
                            <label>Assign Users</label>
                            <div className="users-list">
                                {/* Show creator first if replying */}
                                {previousTask && (
                                    <div key={previousTask.creatorUser} className="user-checkbox" style={{ opacity: '0.7' }}>
                                        <input
                                            type="checkbox"
                                            id={previousTask.creatorUser}
                                            checked={true}
                                            disabled={true}
                                        />
                                        <label htmlFor={previousTask.creatorUser}>
                                            {previousTask.creatorUser} (Creator)
                                        </label>
                                    </div>
                                )}
                                {/* Show current assignees if replying (excluding creator) */}
                                {previousTask && previousTask.assignedUsers.map(userName => {
                                    if (userName !== previousTask.creatorUser) {
                                        return (
                                            <div key={userName} className="user-checkbox" style={{ opacity: '0.7' }}>
                                                <input
                                                    type="checkbox"
                                                    id={userName}
                                                    checked={true}
                                                    disabled={true}
                                                />
                                                <label htmlFor={userName}>{userName} (Current Assignee)</label>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                {/* Show assignable users */}
                                {assignableUsers.map(user => {
                                    const isCurrentAssignee = previousTask?.assignedUsers.includes(user.userName);
                                    const isCreator = previousTask?.creatorUser === user.userName;
                                    if (!isCurrentAssignee && !isCreator) {
                                        return (
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
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={() => navigate('/')}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-button">
                                {previousTask ? 'Submit Reply' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateNewTask; 