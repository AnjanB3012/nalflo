import { getApiBaseUrl } from '../utils/config.js';

// Helper to get the full Nalva API base URL
const getNalvaApiBaseUrl = async () => {
    const apiBaseUrl = await getApiBaseUrl();
    return `${apiBaseUrl}/api/nalva`;
};

// Create a new conversation with Nalva
export const createNewConversation = async (cookieToken, message) => {
    try {
        const baseUrl = await getNalvaApiBaseUrl();
        const response = await fetch(`${baseUrl}/newConversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                message: message
            })
        });
        const data = await response.json();
        if (data.message === "Success") {
            return data;
        } else {
            throw new Error(data.message || 'Failed to create conversation');
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
};

// Send a message in an existing conversation
export const sendMessage = async (cookieToken, conversationId, message) => {
    try {
        const baseUrl = await getNalvaApiBaseUrl();
        const response = await fetch(`${baseUrl}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                conversation_id: conversationId,
                message: message
            })
        });
        const data = await response.json();
        if (data.message === "Success") {
            return data;
        } else {
            throw new Error(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Get conversation history
export const getConversationHistory = async (cookieToken) => {
    try {
        const baseUrl = await getNalvaApiBaseUrl();
        const response = await fetch(`${baseUrl}/getConversationHistory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookie_token: cookieToken
            })
        });
        const data = await response.json();
        if (data.message === "Success") {
            return data;
        } else {
            throw new Error(data.message || 'Failed to fetch conversation history');
        }
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw error;
    }
};

// Get response for a conversation
export const getResponse = async (cookieToken, conversationId) => {
    try {
        const baseUrl = await getNalvaApiBaseUrl();
        const response = await fetch(`${baseUrl}/getResponse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cookie_token: cookieToken,
                conversation_id: conversationId
            })
        });
        const data = await response.json();
        if (data.message === "Success") {
            return data;
        } else {
            throw new Error(data.message || 'Failed to get response');
        }
    } catch (error) {
        console.error('Error getting response:', error);
        throw error;
    }
}; 