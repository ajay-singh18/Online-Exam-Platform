import api from './axios';

export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.put('/users/me', data);

/* SuperAdmin */
export const getUsers = () => api.get('/users');
export const updateUserStatus = (id, status) => api.put(`/users/${id}/status`, { status });
