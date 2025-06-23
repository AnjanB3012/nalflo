import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NalvaChat from '../components/NalvaChat';
import Navbar from '../components/navbar.jsx';
import { getConversationHistory } from '../services/nalvaService';
import { getApiBaseUrl } from '../utils/config.js';
import '../styles/NalvaPage.css';

const NalvaPage = () => {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cookieToken, setCookieToken] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState({});
    const navigate = useNavigate();

    // Load conversation history
    const loadConversationHistory = async () => {
        try {
            const response = await getConversationHistory(cookieToken);
            if (response.message === "Success" && response.conversations) {
                setConversations(response.conversations);
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
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
            setCookieToken(parsedCookie.token);

            try {
                const apiBaseUrl = await getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/getUserPermissions`, {
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

    // Separate useEffect for loading conversation history
    useEffect(() => {
        if (cookieToken && permissions?.nalva) {
            loadConversationHistory();
        }
    }, [cookieToken, permissions]);

    const handleNewChat = () => {
        setSelectedConversation(null);
    };

    const handleConversationSelect = (conversationId) => {
        setSelectedConversation(conversationId);
    };

    const handleConversationUpdate = async () => {
        await loadConversationHistory();
    };

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
                            onClick={handleNewChat}
                        >
                            New Chat
                        </button>
                    </div>
                    <div className="conversations-list">
                        {Object.entries(conversations)
                            .filter(([id, messages]) => messages.length > 0 && messages[0][1].trim() !== "")
                            .reverse()
                            .map(([id, messages]) => (
                                <div
                                    key={id}
                                    className={`conversation-item ${selectedConversation === id ? 'selected' : ''}`}
                                    onClick={() => handleConversationSelect(id)}
                                >
                                    <div className="conversation-preview">
                                        {messages[0][1].substring(0, 50)}...
                                    </div>
                                    <div className="conversation-timestamp">
                                        {new Date(messages[0][2]).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
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
                            onConversationSelect={handleConversationSelect}
                            onConversationUpdate={handleConversationUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NalvaPage; 