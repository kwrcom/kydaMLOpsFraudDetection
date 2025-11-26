/**
 * API Client
 * Handles communication with the backend API
 */
import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API methods
export const apiClient = {
    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    // Transactions
    getTransactions: async (skip = 0, limit = 50, search = '') => {
        const params = new URLSearchParams({
            skip: skip.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);

        const response = await api.get(`/transactions/?${params.toString()}`);
        return response.data;
    },

    getTransactionsCount: async (search = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);

        const response = await api.get(`/transactions/count?${params.toString()}`);
        return response.data;
    },

    getTransaction: async (id: number) => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    // Clients
    getClients: async (skip = 0, limit = 50, search = '') => {
        const params = new URLSearchParams({
            skip: skip.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);

        const response = await api.get(`/clients/?${params.toString()}`);
        return response.data;
    },

    getClientsCount: async (search = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);

        const response = await api.get(`/clients/count?${params.toString()}`);
        return response.data;
    },

    getClient: async (id: number) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },
};

export default apiClient;
