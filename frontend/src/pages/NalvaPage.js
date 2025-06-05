import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NalvaChat from '../components/NalvaChat';
import Navbar from '../components/Navbar';
import '../styles/NalvaPage.css';

const NalvaPage = () => {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cookieToken, setCookieToken] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            setCookieToken(parsedCookie.token);

            try {
                const response = await fetch("http://localhost:8080/api/getUserPermissions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: parsedCookie.token }),
                });
                const data = await response.json();
                if (data.message === "Success") {
                    if (!data.permissions.nalva) {
                        setError("You don't have permission to access Nalva");
                        return;
                    }
                    setPermissions(data.permissions);
                } else {
                    setError("Failed to verify permissions");
                }
            } catch (err) {
                console.error("Error fetching permissions:", err);
                setError("Failed to connect to the server");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    if (loading) {
        return (
            <div className="nalva-page">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                    nalvaPermission={permissions?.nalva}
                />
                <div className="loading-message">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="nalva-page">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                    nalvaPermission={permissions?.nalva}
                />
                <div className="error-message">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="nalva-page">
            <Navbar 
                HomePermission={permissions?.home} 
                IAMPermission={permissions?.iam} 
                apisPermission={permissions?.development}
                managementPermission={permissions?.management}
                nalvaPermission={permissions?.nalva}
            />
            <div className="nalva-container">
                <div className="nalva-sidebar">
                    <div className="sidebar-header">
                        <h2>Conversations</h2>
                        <button 
                            className="new-chat-button"
                            onClick={() => setSelectedConversation(null)}
                        >
                            New Chat
                        </button>
                    </div>
                    <div className="conversations-list">
                        {/* Conversation list will be rendered here */}
                    </div>
                </div>
                <div className="nalva-main">
                    <div className="nalva-header">
                        <h1>Nalva Assistant</h1>
                        <p>Your AI-powered assistant for help and guidance</p>
                    </div>
                    <div className="nalva-content">
                        <NalvaChat 
                            cookieToken={cookieToken} 
                            selectedConversation={selectedConversation}
                            onConversationSelect={setSelectedConversation}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NalvaPage; 