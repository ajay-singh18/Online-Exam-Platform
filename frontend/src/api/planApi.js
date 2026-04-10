import api from './axios';

// Public/Admin
export const getActivePlans = () => api.get('/plans');

// SuperAdmin
export const getAllPlans = () => api.get('/plans/all');
export const createPlan = (data) => api.post('/plans', data);
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/plans/${id}`);
