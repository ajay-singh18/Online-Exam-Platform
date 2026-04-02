import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if trying to access unauthorized area
    const redirectMap: Record<string, string> = {
      superAdmin: '/superadmin',
      admin: '/admin',
      student: '/student',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}
