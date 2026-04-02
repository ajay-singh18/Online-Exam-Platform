import api from './axios';

export const getExams = () => api.get('/exams');
export const getExamById = (id) => api.get(`/exams/${id}`);
export const createExam = (data) => api.post('/exams', data);
export const updateExam = (id, data) => api.put(`/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/exams/${id}`);
export const getEnrolledStudents = (id) => api.get(`/exams/${id}/enrol`);
export const enrolStudents = (id, data) => api.post(`/exams/${id}/enrol`, data);
