import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import '../styles/home.css';

function Home() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);
    const [currentUser, setCurrentUser] = useState('');
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async (cookieToken) => {
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
                setTasks(data.tasks);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setError("Failed to fetch tasks");
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;
            setCurrentUser(parsedCookie.username);

            // Get permissions from localStorage or fetch them
            const storedPermissions = localStorage.getItem("user_permissions");
            if (storedPermissions) {
                setPermissions(JSON.parse(storedPermissions));
            } else {
                try {
                    const response = await fetch("http://localhost:8080/api/getUserPermissions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ cookie_token: cookieToken }),
                    });
                    const data = await response.json();
                    if (data.message === "Success") {
                        setPermissions(data.permissions);
                        localStorage.setItem("user_permissions", JSON.stringify(data.permissions));
                    }
                } catch (error) {
                    console.error("Error fetching permissions:", error);
                }
            }

            // Fetch tasks
            await fetchTasks(cookieToken);
            setLoading(false);
        };

        fetchUserData();
    }, [navigate]);

    const handleDeleteTask = async (taskId) => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) return;

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        try {
            const response = await fetch("http://localhost:8080/api/home/deleteTask", {
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
                setTasks(tasks.filter(task => task.taskId !== taskId));
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            setError("Failed to delete task");
        }
    };

    const handleCloseTask = async (taskId) => {
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
                // Refresh tasks after successful close
                await fetchTasks(cookieToken);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error closing task:", error);
            setError("Failed to close task. Please try again.");
        }
    };

    const filteredTasks = tasks?.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showCompleted ? true : task.status;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="home-container">
            <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} />
            <div className="main-content">
                <div className="filters-container">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-buttons">
                        <button
                            className={`filter-button ${showCompleted ? 'active' : ''}`}
                            onClick={() => setShowCompleted(true)}
                        >
                            Show All
                        </button>
                        <button
                            className={`filter-button ${!showCompleted ? 'active' : ''}`}
                            onClick={() => setShowCompleted(false)}
                        >
                            Show Active Only
                        </button>
                        <button
                            className="create-task-button"
                            onClick={() => navigate('/createNewTask')}
                        >
                            Create New Task
                        </button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Loading tasks...</span>
                    </div>
                ) : (
                    <div className="tasks-table-container">
                        <table className="tasks-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Created By</th>
                                    <th>Created On</th>
                                    <th>Assigned To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-tasks">
                                            No tasks found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <tr key={task.taskId} className="task-row">
                                            <td>{task.title}</td>
                                            <td>{task.description}</td>
                                            <td>
                                                <span className={`status-badge ${task.status ? 'open' : 'closed'}`}>
                                                    {task.status ? 'Open' : 'Closed'}
                                                </span>
                                            </td>
                                            <td>{task.creatorUser?.userName || 'Unknown'}</td>
                                            <td>{new Date(task.creationTimeStamp).toLocaleString()}</td>
                                            <td>{task.assignedUsers?.map(user => user.userName).join(', ') || 'None'}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="view-button"
                                                    onClick={() => navigate(`/task/${task.taskId}`)}
                                                >
                                                    View
                                                </button>
                                                {task.creatorUser?.userName === currentUser && (
                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleDeleteTask(task.taskId)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;