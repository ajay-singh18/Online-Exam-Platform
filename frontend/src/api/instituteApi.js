import api from './axios';

export const getInstitutes = () => api.get('/institutes');
export const createInstitute = (data) => api.post('/institutes', data);
export const updateInstitute = (id, data) => api.put(`/institutes/${id}`, data);
export const deleteInstitute = (id) => api.delete(`/institutes/${id}`);
