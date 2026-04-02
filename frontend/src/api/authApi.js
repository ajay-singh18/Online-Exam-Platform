import api from './axios';

export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (data) => api.post('/auth/register', data);
export const refreshToken = () => api.post('/auth/refresh');
export const logoutUser = () => api.post('/auth/logout');
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
