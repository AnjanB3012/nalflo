import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import ErrorPage from "./ErrorPage";

function Home() {
    const [permissions, setPermissions] = useState(null);
    const [error, setError] = useState(false);

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

    const handleLogout = () => {
        localStorage.removeItem("local_cookie");
        window.location.href = "/";
    };

    if (error) {
        return <ErrorPage />;
    }

    return (
        <div>
            {permissions && <Navbar HomePermission={permissions.home} IAMPermission={permissions.iam} />}
            <h1>Welcome to the Home Page</h1>
            <p>This is the home page of the application.</p>
            <p>You can navigate to different sections from here.</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
        
}

export default Home;