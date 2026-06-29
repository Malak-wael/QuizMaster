import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

export function GuestOnlyRoute({ children }) {
  const user = getCurrentUser();

  if (user?.role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }

  if (user?.role === 'student') {
    return <Navigate to="/student/join" replace />;
  }

  return children;
}

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === 'teacher' ? '/teacher' : '/student/join';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

