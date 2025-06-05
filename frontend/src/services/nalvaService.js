import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/nalva';

// Create a new conversation with Nalva
export const createNewConversation = async (cookieToken, message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/newConversation`, {
            cookie_token: cookieToken,
            message: message
        });
        if (response.data.message === "Success") {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to create conversation');
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error.response?.data || { message: 'Failed to create conversation' };
    }
};

// Send a message in an existing conversation
export const sendMessage = async (cookieToken, conversationId, message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
            cookie_token: cookieToken,
            conversation_id: conversationId,
            message: message
        });
        if (response.data.message === "Success") {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error.response?.data || { message: 'Failed to send message' };
    }
};

// Get conversation history
export const getConversationHistory = async (cookieToken) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/getConversationHistory`, {
            cookie_token: cookieToken
        });
        if (response.data.message === "Success") {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch conversation history');
        }
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw error.response?.data || { message: 'Failed to fetch conversation history' };
    }
}; 