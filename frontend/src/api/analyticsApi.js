import api from './axios';

export const getExamSummary = (examId) => api.get(`/analytics/exam/${examId}/summary`);
export const getPlatformSummary = () => api.get('/analytics/platform');
