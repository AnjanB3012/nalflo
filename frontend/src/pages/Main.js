import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorPage from "./ErrorPage";

function Main() {
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loginCred = localStorage.getItem("local_cookie");
        if (loginCred) {
            navigate("/home");
        } else {
            fetch("http://localhost:8080/api/homeCheck")
                .then((response) => response.json())
                .then((data) => setData(data))
                .catch((error) => console.error("Error fetching data:", error));
        }
    }, [navigate]);

    useEffect(() => {
        if (data) {
            if (data.message === "1") {
                navigate("/login");
            } else if (data.message === "0") {
                navigate("/setup");
            }
        }
    }, [data, navigate]);

    if (!data) {
        return <div>Loading...</div>; 
    }

    return <ErrorPage />;
}

export default Main;
