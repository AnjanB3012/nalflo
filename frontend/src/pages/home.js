import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";

function Home() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);
    const [tasks, setTasks] = useState(null); // Initialize as null to differentiate between loading and empty state

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
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <h1>Welcome to the Home Page</h1>
            <div className="card-container">
                <div className="card">
                    <h2>Tasks</h2>
                    {tasks ? ( // Render table only when tasks are loaded
                        <table>
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Creation Time</th>
                                    <th>Creator</th>
                                    <th>Task Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.taskId}>
                                        <td>{task.title}</td>
                                        <td>{task.creationTimeStamp}</td>
                                        <td>{task.creatorUser.userName}</td>
                                        <td>{task.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Loading tasks...</p> // Show a loading message while tasks are being fetched
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;