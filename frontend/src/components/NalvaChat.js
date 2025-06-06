import React, { useState, useEffect, useRef } from 'react';
import { createNewConversation, sendMessage, getConversationHistory } from '../services/nalvaService';
import '../styles/NalvaChat.css';

const NalvaChat = ({ cookieToken, selectedConversation, onConversationSelect, onConversationUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState({});
    const [isPolling, setIsPolling] = useState(false);
    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversation history when selected conversation changes
    useEffect(() => {
        const loadConversationHistory = async () => {
            try {
                const response = await getConversationHistory(cookieToken);
                if (response.message === "Success" && response.conversations) {
                    setConversations(response.conversations);
                    if (selectedConversation) {
                        const conversationMessages = response.conversations[selectedConversation] || [];
                        setMessages(conversationMessages.map(msg => ({
                            type: msg[0],
                            message: msg[1],
                            timestamp: msg[2],
                            conversationId: parseInt(selectedConversation)
                        })));
                        setCurrentConversationId(parseInt(selectedConversation));
                    } else {
                        setMessages([]);
                        setCurrentConversationId(null);
                    }
                }
            } catch (error) {
                console.error('Failed to load conversation history:', error);
            }
        };

        if (cookieToken) {
            loadConversationHistory();
        }
    }, [cookieToken, selectedConversation]);

    // Poll for responses when a message is sent
    useEffect(() => {
        if (isPolling && currentConversationId) {
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    const response = await fetch('http://localhost:8080/api/nalva/getResponse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cookie_token: cookieToken,
                            conversation_id: currentConversationId
                        })
                    });
                    
                    const data = await response.json();
                    if (data.response) {
                        // Got the response, update UI
                        setMessages(prevMessages => [
                            ...prevMessages,
                            {
                                type: 'nalva',
                                message: data.response.message,
                                timestamp: data.response.timestamp,
                                conversationId: currentConversationId
                            }
                        ]);
                        setIsPolling(false);
                        clearInterval(pollingIntervalRef.current);
                        onConversationUpdate(); // Update conversation list
                    }
                } catch (error) {
                    console.error('Error polling for response:', error);
                }
            }, 1000); // Poll every second
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [isPolling, currentConversationId, cookieToken]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        setIsLoading(true);
        try {
            let response;
            if (!currentConversationId) {
                // Start new conversation
                response = await createNewConversation(cookieToken, inputMessage);
                if (response.message === "Success") {
                    setCurrentConversationId(response.conversation_id);
                    onConversationSelect(response.conversation_id.toString());
                }
            } else {
                // Send message in existing conversation
                response = await sendMessage(cookieToken, currentConversationId, inputMessage);
            }

            if (response.message === "Success") {
                // Add the user's message immediately to the UI
                const userMessage = {
                    type: 'user',
                    message: inputMessage,
                    timestamp: new Date().toISOString(),
                    conversationId: currentConversationId || response.conversation_id
                };
                
                setMessages(prevMessages => [...prevMessages, userMessage]);
                setInputMessage('');
                
                // Start polling for response
                setIsPolling(true);
            } else {
                console.error('Failed to send message:', response.message);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Show error to user
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    type: 'error',
                    message: 'Failed to send message. Please try again.',
                    timestamp: new Date().toISOString(),
                    conversationId: currentConversationId
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="nalva-chat-container">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <h3>No messages yet</h3>
                        <p>Start a new conversation by sending a message below</p>
                    </div>
                ) : (
                    messages.filter(msg => msg.message && msg.message.trim() !== "").map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.type === 'user' ? 'user-message' : 'nalva-message'}`}
                        >
                            <div className="message-content">
                                <div className="message-sender">
                                    {msg.type === 'user' ? 'You' : 'Nalva'}
                                </div>
                                <div className="message-text">{msg.message}</div>
                                <div className="message-timestamp">
                                    {formatTimestamp(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default NalvaChat; 