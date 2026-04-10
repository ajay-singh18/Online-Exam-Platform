import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmail from './pages/VerifyEmail';
import StudentDashboard from './pages/StudentDashboard';
import StudentExams from './pages/StudentExams';
import StudentResultsList from './pages/StudentResultsList';
import ExamLobby from './pages/ExamLobby';
import ExamInterface from './pages/ExamInterface';
import ExamResults from './pages/ExamResults';
import AdminDashboard from './pages/AdminDashboard';
import AdminExams from './pages/AdminExams';
import QuestionBank from './pages/QuestionBank';
import QuestionEditor from './pages/QuestionEditor';
import SplitScreenEditor from './pages/SplitScreenEditor';
import ExamBuilder from './pages/ExamBuilder';
import ExamStudents from './pages/ExamStudents';
import BatchManagement from './pages/BatchManagement';
import ExamResultsAdmin from './pages/ExamResultsAdmin';
import ExamAnalytics from './pages/ExamAnalytics';
import AdminResults from './pages/AdminResults';
import ReportCards from './pages/ReportCards';
import Pricing from './pages/Pricing';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import InstituteManagement from './pages/InstituteManagement';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import Settings from './pages/Settings';

import UserManagement from './pages/UserManagement';
import PlatformAnalytics from './pages/PlatformAnalytics';
import Help from './pages/Help';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Auth (public) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Student Portal */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="results" element={<StudentResultsList />} />
            <Route path="results/:attemptId" element={<ExamResults />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>

        {/* Exam Flow (standalone, no sidebar) */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/exam/lobby/:examId" element={<ExamLobby />} />
          <Route path="/exam/take/:examId" element={<ExamInterface />} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="exams/new" element={<ExamBuilder />} />
            <Route path="exams/:examId/edit" element={<ExamBuilder />} />
            <Route path="exams/:examId/students" element={<ExamStudents />} />
            <Route path="exams/:examId/results" element={<ExamResultsAdmin />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="editor" element={<QuestionEditor />} />
            <Route path="editor/split" element={<SplitScreenEditor />} />
            <Route path="analytics" element={<ExamAnalytics />} />
            <Route path="analytics/:examId" element={<ExamAnalytics />} />
            <Route path="batches" element={<BatchManagement />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="report-cards" element={<ReportCards />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>

        {/* SuperAdmin Portal */}
        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superAdmin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="institutes" element={<InstituteManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
