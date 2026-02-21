import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = `http://${window.location.hostname}:5001`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('hms_token');
            const storedUser = localStorage.getItem('hms_user');
            if (!token || !storedUser) return;
            const userData = JSON.parse(storedUser);

            const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data) {
                setUser(res.data);
                localStorage.setItem('hms_user', JSON.stringify(res.data));
            }
        } catch (err) {
            console.error("User refresh failed:", err);
        }
    };

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('hms_user');
            const token = localStorage.getItem('hms_token');
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        } catch (err) {
            console.error("Auth initialization failed:", err);
            localStorage.removeItem('hms_user');
            localStorage.removeItem('hms_token');
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { identifier, password });
            const { token, user } = res.data;

            localStorage.setItem('hms_token', token);
            localStorage.setItem('hms_user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(user);
            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const token = localStorage.getItem('hms_token');
            const res = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return { success: true, user: res.data.user };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
