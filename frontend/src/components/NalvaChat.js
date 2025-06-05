import React, { useState, useEffect, useRef } from 'react';
import { createNewConversation, sendMessage, getConversationHistory } from '../services/nalvaService';
import '../styles/NalvaChat.css';

const NalvaChat = ({ cookieToken, selectedConversation, onConversationSelect }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState({});
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversation history on component mount
    useEffect(() => {
        const loadConversationHistory = async () => {
            try {
                const response = await getConversationHistory(cookieToken);
                if (response.message === "Success" && response.conversations) {
                    setConversations(response.conversations);
                    // If a conversation is selected, load its messages
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
                        // If no conversation is selected, show all messages
                        const allMessages = Object.entries(response.conversations).flatMap(([conversationId, messages]) => {
                            return messages.map(msg => ({
                                type: msg[0],
                                message: msg[1],
                                timestamp: msg[2],
                                conversationId: parseInt(conversationId)
                            }));
                        });
                        setMessages(allMessages);
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
                    onConversationSelect(response.conversation_id);
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
                
                // Add Nalva's reply if available
                const nalvaMessage = response.reply ? {
                    type: 'nalva',
                    message: response.reply,
                    timestamp: new Date().toISOString(),
                    conversationId: currentConversationId || response.conversation_id
                } : null;

                setMessages(prevMessages => [
                    ...prevMessages,
                    userMessage,
                    ...(nalvaMessage ? [nalvaMessage] : [])
                ]);
                setInputMessage('');

                // Refresh conversation history to ensure consistency
                const historyResponse = await getConversationHistory(cookieToken);
                if (historyResponse.message === "Success" && historyResponse.conversations) {
                    setConversations(historyResponse.conversations);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
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
                    messages.map((msg, index) => (
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