import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            const res = await axios.post('http://localhost:5000/api/auth/login', { identifier, password });
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
            const res = await axios.post('http://localhost:5000/api/auth/register', userData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // DO NOT call setUser(user) or store token here!
            // The Warden/Admin is performing the registration and should stay logged in.
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
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
