import api from './axios';

export const getPlans = () => api.get('/payments/plans');
export const getSubscriptionStatus = () => api.get('/payments/status');
export const createOrder = (plan) => api.post('/payments/create-order', { plan });
export const verifyPayment = (data) => api.post('/payments/verify', data);

/* Team management */
export const getTeamMembers = () => api.get('/payments/team');
export const inviteAdmin = (data) => api.post('/payments/team/invite', data);
export const removeAdmin = (userId) => api.delete(`/payments/team/${userId}`);
