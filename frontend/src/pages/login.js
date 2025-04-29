import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://localhost:8080/api/homeCheck")
            .then((response) => response.json())
            .then((data) => setData(data))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    useEffect(() => {
        if (data) {
            if (data.message === "0") {
                navigate("/setup");
            }
        }
    }, [data, navigate]);

    const handleLogin = () => {
        if (data && data.message === "1") {
            fetch('http://localhost:8080/api/loginUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message === "Success") {
                        const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
                        const cookieData = {
                            token: data.cookie_token,
                            expiresAt: expirationTime,
                        };
                        localStorage.setItem("local_cookie", JSON.stringify(cookieData));
                        window.location.href = "/home";
                    } else {
                        alert("Invalid credentials. Please try again.");
                    }
                })
                .catch((error) => console.error('Error:', error));
        }
    };

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <div
            style={{
                width: '350px',
                margin: 'auto',
                marginTop: '80px',
                padding: '30px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ffffff, #e0e7ff)',
                boxShadow: '0 4px 12px rgba(3, 44, 252, 0.2)',
            }}
        >
            <h2 style={{ textAlign: 'center', color: '#032cfc', marginBottom: '30px' }}>
                Login
            </h2>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '5px',
                    border: '1px solid #032cfc',
                    outline: 'none',
                    fontSize: '16px',
                }}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '5px',
                    border: '1px solid #032cfc',
                    outline: 'none',
                    fontSize: '16px',
                }}
            />
            <button
                onClick={handleLogin}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#032cfc',
                    color: '#fff',
                    fontSize: '16px',
                    cursor: 'pointer',
                }}
            >
                Login
            </button>
        </div>
    );
}

export default Login;