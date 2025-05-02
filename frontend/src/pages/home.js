import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";
import "../styles/home.css";

function Home() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [tasks, setTasks] = useState(null);

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        fetch("http://localhost:8080/api/getUserPermissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cookie_token: cookieToken }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    setPermissions(data.permissions);
                } else {
                    setError(true);
                }
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                setError(true);
            });
    }, []);

    useEffect(() => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError(true);
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        const cookieToken = parsedCookie.token;

        fetch("http://localhost:8080/api/home/getUserTasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cookie_token: cookieToken }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Success") {
                    setTasks(data.tasks); // Ensure tasks are set correctly
                } else {
                    console.error("API Error:", data);
                    setError(true);
                }
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                setError(true);
            });
    }, []);

    if (error) {
        return <ErrorPage />;
    }

    return (
        <div className="home-container">
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <div className="main-content">
                <div className="content-card">
                    <div className="header-section">
                        <h1 className="header-title">Welcome to NalfFlo</h1>
                        <p className="header-subtitle">Manage your tasks and workflows efficiently</p>
                    </div>
                    <div className="tasks-section">
                        <div>
                            <h2 className="tasks-header">Your Tasks</h2>
                            
                            <div className="table-controls">
                                <div className="entries-control">
                                    <span>Show</span>
                                    <select className="entries-select">
                                        <option>10</option>
                                        <option>25</option>
                                        <option>50</option>
                                    </select>
                                    <span>entries</span>
                                </div>
                                <div className="search-control">
                                    <span>Search:</span>
                                    <input type="text" className="search-input" placeholder="Search tasks..." />
                                </div>
                            </div>

                            {tasks === null ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                    <span>Loading tasks...</span>
                                </div>
                            ) : (
                                <div className="tasks-table-container">
                                    <table className="tasks-table">
                                        <thead>
                                            <tr>
                                                <th>Task Name</th>
                                                <th>Creation Time</th>
                                                <th>Creator</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} style={{ textAlign: 'center' }}>
                                                        No tasks available at the moment.
                                                    </td>
                                                </tr>
                                            ) : (
                                                tasks.map((task) => (
                                                    <tr key={task.taskId}>
                                                        <td>{task.title}</td>
                                                        <td>{task.creationTimeStamp}</td>
                                                        <td>{task.creatorUser.userName}</td>
                                                        <td>
                                                            <span className={`status-badge ${
                                                                task.status === 'Completed' 
                                                                    ? 'status-completed'
                                                                    : task.status === 'In Progress'
                                                                    ? 'status-in-progress'
                                                                    : 'status-pending'
                                                            }`}>
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                    
                                    <div className="pagination">
                                        <div className="pagination-info">
                                            Showing 1 to {Math.min(tasks.length, 10)} of {tasks.length} entries
                                        </div>
                                        <div className="pagination-buttons">
                                            <button className="pagination-button active">1</button>
                                            <button className="pagination-button">2</button>
                                            <button className="pagination-button">3</button>
                                            <button className="pagination-button">»</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;