import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import '../styles/home.css';

function Home() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
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
            console.log("Received tasks data:", data);
            if (data.message === "Success") {
                setTasks(data.tasks);
                console.log("Set tasks:", data.tasks);
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
                }
            } catch (error) {
                console.error("Error fetching permissions:", error);
            }

            // Fetch tasks
            await fetchTasks(cookieToken);
            setLoading(false);
        };

        fetchUserData();
    }, [navigate]);

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
        // Debug log for each task being filtered
        console.log("Filtering task:", task);
        
        const matchesSearch = !searchTerm || 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = showCompleted ? true : task.status === true;
        
        console.log("Task matches:", { 
            taskId: task.taskId,
            matchesSearch,
            matchesStatus,
            status: task.status
        });
        
        return matchesSearch && matchesStatus;
    }) || [];

    // Ensure unique tasks by taskId
    const uniqueTasks = filteredTasks.reduce((acc, current) => {
        const x = acc.find(item => item.taskId === current.taskId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    return (
        <div className="home-container">
            <Navbar HomePermission={permissions?.home} IAMPermission={permissions?.iam} apisPermission={permissions?.development} />
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
                            className={`filter-button ${!showCompleted ? 'active' : ''}`}
                            onClick={() => {
                                setShowCompleted(false);
                                // Refresh tasks when switching views
                                const cookieData = localStorage.getItem("local_cookie");
                                if (cookieData) {
                                    const parsedCookie = JSON.parse(cookieData);
                                    fetchTasks(parsedCookie.token);
                                }
                            }}
                        >
                            Show Active Only
                        </button>
                        <button
                            className={`filter-button ${showCompleted ? 'active' : ''}`}
                            onClick={() => {
                                setShowCompleted(true);
                                // Refresh tasks when switching views
                                const cookieData = localStorage.getItem("local_cookie");
                                if (cookieData) {
                                    const parsedCookie = JSON.parse(cookieData);
                                    fetchTasks(parsedCookie.token);
                                }
                            }}
                        >
                            Show All
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
                                {uniqueTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-tasks">No tasks found</td>
                                    </tr>
                                ) : (
                                    uniqueTasks.map((task) => (
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
                                            <td>
                                                {(() => {
                                                    const assignees = task.assignedUsers?.filter(user => user.userName !== task.creatorUser?.userName) || [];
                                                    const creator = task.creatorUser?.userName;
                                                    const assigneeList = assignees.map(user => user.userName);
                                                    if (creator) {
                                                        assigneeList.unshift(`${creator} (Creator)`);
                                                    }
                                                    return assigneeList.join(', ') || 'None';
                                                })()}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="view-button"
                                                    onClick={() => navigate(`/task/${task.taskId}`)}
                                                >
                                                    View
                                                </button>
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