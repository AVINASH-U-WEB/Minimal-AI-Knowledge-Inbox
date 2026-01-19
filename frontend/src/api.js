import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
        console.error('API Error:', errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
);

export const ingestContent = async (content, sourceType, url = null) => {
    const response = await api.post('/ingest', {
        content,
        source_type: sourceType,
        url: url, // Optional URL for notes
    });
    return response.data;
};

export const getItems = async () => {
    const response = await api.get('/items');
    return response.data;
};

export const queryKnowledge = async (question, itemId = null) => {
    const response = await api.post('/query', {
        question,
        item_id: itemId,  // Optional: filter to specific item
    });
    return response.data;
};

export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export const deleteItem = async (itemId) => {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
};

export default api;
