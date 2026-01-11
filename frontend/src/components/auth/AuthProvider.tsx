/**
 * Authentication context provider.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { User, LoginCredentials, LoginResponse } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            const storedUser = localStorage.getItem('user');
            const accessToken = localStorage.getItem('access_token');

            if (storedUser && accessToken) {
                try {
                    // Verify token is still valid by fetching current user
                    const response = await apiClient.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
            const { access_token, refresh_token, user: userData } = response.data;

            // Store tokens and user data
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            // Redirect based on role
            const roleName = userData.role.name;
            if (roleName === 'admin') {
                router.push('/dashboard/admin');
            } else if (roleName === 'manager') {
                router.push('/dashboard/manager');
            } else {
                router.push('/dashboard/user');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || 'Login failed';
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
            router.push('/login');
        }
    };

    const refreshUser = async () => {
        try {
            const response = await apiClient.get('/auth/me');
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
