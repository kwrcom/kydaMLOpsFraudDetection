/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as loginService, register as registerService, getCurrentUser, logout as logoutService, isAuthenticated, getStoredUser } from '@/lib/auth-service';

// Context type definition
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                // Check if authenticated
                if (isAuthenticated()) {
                    // Try to get stored user first
                    const storedUser = getStoredUser();
                    if (storedUser) {
                        setUser(storedUser);
                    }

                    // Fetch fresh user data from API
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                // Clear invalid auth data
                logoutService();
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // Login function
    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            // Call login API
            await loginService({ username, password });

            // Get user data
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (username: string, password: string, fullName?: string) => {
        setLoading(true);
        try {
            // Call register API
            await registerService({
                username,
                password,
                full_name: fullName,
            });

            // Auto-login after registration
            await login(username, password);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        logoutService();
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
