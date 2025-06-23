import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/config.js';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [data, setData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const loginCred = localStorage.getItem("local_cookie");
    if (loginCred) {
        navigate("/home");
    }

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (data) {
            if (data.message === "0") {
                navigate("/setup");
            }
        }
    }, [data, navigate]);

    const handleLogin = async () => {
        if (data && data.message === "1") {
            try {
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/loginUser`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                
                if (data.message === "Success") {
                    const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
                    const cookieData = {
                        token: data.cookie_token,
                        expiresAt: expirationTime,
                        username: username
                    };
                    localStorage.setItem("local_cookie", JSON.stringify(cookieData));
                    
                    // Fetch user permissions
                    const permissionsResponse = await fetch(`${apiBaseUrl}/api/getUserPermissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cookie_token: data.cookie_token }),
                    });
                    const permissionsData = await permissionsResponse.json();
                    
                    if (permissionsData.message === "Success") {
                        localStorage.setItem("user_permissions", JSON.stringify(permissionsData.permissions));
                        window.location.href = "/home";
                    }
                } else {
                    alert("Invalid credentials. Please try again.");
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
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
                onKeyPress={handleKeyPress}
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
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #032cfc',
                        outline: 'none',
                        fontSize: '16px',
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#032cfc',
                        fontSize: '14px',
                    }}
                >
                    {showPassword ? 'Hide' : 'Show'}
                </button>
            </div>
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