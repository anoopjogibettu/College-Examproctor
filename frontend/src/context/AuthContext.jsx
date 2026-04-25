import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUserStr = localStorage.getItem('user');
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                setUser(storedUser);
                
                // Fetch fresh profile data in background to keep state synced
                if (storedUser.token) {
                    try {
                        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                            headers: { Authorization: `Bearer ${storedUser.token}` }
                        });
                        const updatedUser = {
                            ...storedUser,
                            ...data,
                            hasFaceRegistered: data.faceEncoding && data.faceEncoding.length > 0
                        };
                        console.log('Profile sync complete. Face registered:', updatedUser.hasFaceRegistered);
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    } catch (err) {
                        console.error('Failed to refresh user profile:', err);
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data; // returns token as well
    };

    const sendOtp = async (email) => {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, { email });
        return data;
    };

    const register = async (name, email, password, stream, branch, specialization, year, otp) => {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, { name, email, password, stream, branch, specialization, year, otp });
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateFaceRegistrationStatus = () => {
        const updatedUser = { ...user, hasFaceRegistered: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateFaceRegistrationStatus, sendOtp }}>
            {children}
        </AuthContext.Provider>
    );
};
