import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import '../styles/createNewTask.css';

function CreateNewTask() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssignableUsers = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

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
                }
            } catch (error) {
                console.error("Error fetching assignable users:", error);
                setError("Failed to fetch assignable users");
            }
        };

        fetchAssignableUsers();
    }, [navigate]);

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
            const response = await fetch("http://localhost:8080/api/home/createNewTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cookie_token: cookieToken,
                    task_title: title,
                    task_description: description,
                    task_assignees: selectedUsers
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
                <div className="content-card">
                    <h1>Create New Task</h1>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit} className="task-form">
                        <div className="form-group">
                            <label htmlFor="title">Task Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Task Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter task description"
                                rows="4"
                            />
                        </div>
                        <div className="form-group">
                            <label>Assign Users</label>
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
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={() => navigate('/')}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-button">
                                Create Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateNewTask; 