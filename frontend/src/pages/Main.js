import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorPage from "./ErrorPage";
import { getApiBaseUrl } from '../utils/config.js';

function Main() {
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loginCred = localStorage.getItem("local_cookie");
        if (loginCred) {
            navigate("/home");
        } else {
            const checkHome = async () => {
                try {
                    const apiBaseUrl = await getApiBaseUrl();
                    const response = await fetch(`${apiBaseUrl}/api/homeCheck`);
                    const data = await response.json();
                    setData(data);
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            };
            checkHome();
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
