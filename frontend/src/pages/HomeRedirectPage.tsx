import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRouteForUser } from '../auth/authRouting';

export function HomeRedirectPage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-state">Loading Smart Campus...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: 'auth-required' }}
      />
    );
  }

  return <Navigate to={getDefaultRouteForUser(user)} replace />;
}
