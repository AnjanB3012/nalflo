// Configuration utility for API endpoints
let config = null;

// Load configuration from config.json
const loadConfig = async () => {
    if (config) return config;
    
    try {
        const response = await fetch('/config.json');
        config = await response.json();
        return config;
    } catch (error) {
        console.error('Failed to load config.json:', error);
        // Fallback to default values
        config = {
            HOST_SERVER: "http://localhost",
            PORT_SERVER: "8080"
        };
        return config;
    }
};

// Get the base API URL
export const getApiBaseUrl = async () => {
    const config = await loadConfig();
    return `${config.HOST_SERVER}:${config.PORT_SERVER}`;
};

// Get the full server URL
export const getServerUrl = async () => {
    const config = await loadConfig();
    return `${config.HOST_SERVER}:${config.PORT_SERVER}`;
};

// Pre-load config for immediate use
loadConfig(); 