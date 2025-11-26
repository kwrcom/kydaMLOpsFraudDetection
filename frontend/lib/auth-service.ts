/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
import apiClient from './api-client';

// Type definitions for authentication
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    full_name?: string;
}

export interface User {
    id: number;
    username: string;
    full_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

/**
 * Register a new user
 * @param data - User registration data
 * @returns User object
 */
export const register = async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
};

/**
 * Login user and get access token
 * @param data - Login credentials
 * @returns Auth response with token
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    // Send credentials as query parameters
    const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        null,
        {
            params: {
                username: data.username,
                password: data.password
            }
        }
    );

    // Store token in localStorage
    if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
    }

    return response.data;
};

/**
 * Get current user information
 * Requires valid authentication token
 * @returns Current user object
 */
export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');

    // Store user data in localStorage
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

/**
 * Logout user
 * Clears token and user data from localStorage
 */
export const logout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    // Redirect to login page
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
};

/**
 * Check if user is authenticated
 * @returns true if user has valid token
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
};

/**
 * Get stored user data
 * @returns User object or null
 */
export const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};
