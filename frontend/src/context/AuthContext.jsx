import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );

    const navigate = useNavigate();

    const loginUser = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login/`, {
                username: email, password
            });
            if (response.status === 200) {
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                navigate('/dashboard');
                return { success: true };
            }
        } catch (error) {
            console.error("Login failed:", error);
            return { success: false, error: error.response?.data?.detail || "Login failed" };
        }
    };

    const registerUser = async (username, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/signup/`, {
                username, email, password
            });
            if (response.status === 201) {
                // Navigate to OTP page
                navigate('/verify-otp', { state: { email } });
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Registration failed" };
        }
    };

    const verifyOTP = async (email, code) => {
        try {
            const response = await axios.post(`${API_URL}/auth/verify-otp/`, {
                email, code
            });
            if (response.status === 200) {
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                navigate('/dashboard');
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Verification failed" };
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/');
    };

    useEffect(() => {
        if (authTokens) {
            setUser(jwtDecode(authTokens.access));
        }
        setLoading(false);
    }, [authTokens]);

    // Add interceptor to attach token to requests
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            config => {
                if (authTokens) {
                    config.headers.Authorization = `Bearer ${authTokens.access}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );
        return () => axios.interceptors.request.eject(interceptor);
    }, [authTokens]);


    const contextData = {
        user,
        authTokens,
        loginUser,
        registerUser,
        verifyOTP,
        logoutUser,
        loading
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};
