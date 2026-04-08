import api from './axios';

export const startAttempt = (examId) => api.post(`/attempts/start/${examId}`);
export const saveAttempt = (attemptId, data) => api.put(`/attempts/save/${attemptId}`, data);
export const submitAttempt = (attemptId, data) => api.post(`/attempts/submit/${attemptId}`, data);
export const getMyAttempts = () => api.get('/attempts/my');
export const getExamAttempts = (examId) => api.get(`/attempts/exam/${examId}`);
export const getMissedStudents = (examId) => api.get(`/attempts/exam/${examId}/missed`);
export const getAttemptResult = (attemptId) => api.get(`/attempts/${attemptId}/result`);
