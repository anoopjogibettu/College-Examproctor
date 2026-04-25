import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
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
