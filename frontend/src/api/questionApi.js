import api from './axios';

export const getQuestions = (params) => api.get('/questions', { params });
export const createQuestion = (formData) => api.post('/questions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateQuestion = (id, formData) => api.put(`/questions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
export const bulkImportQuestions = (questions) => api.post('/questions/bulk-import', { questions });
export const importFromAI = (formData) => api.post('/questions/import/ai', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getTopics = () => api.get('/questions/topics');
export const getSubjects = () => api.get('/questions/subjects');
