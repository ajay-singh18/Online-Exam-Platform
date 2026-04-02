import api from './axios';

export const getBatches = () => api.get('/batches');
export const createBatch = (data) => api.post('/batches', data);
export const updateBatch = (id, data) => api.put(`/batches/${id}`, data);
export const deleteBatch = (id) => api.delete(`/batches/${id}`);
export const addStudentsToBatch = (id, data) => api.post(`/batches/${id}/students`, data);
export const removeStudentFromBatch = (batchId, studentId) => api.delete(`/batches/${batchId}/students/${studentId}`);
