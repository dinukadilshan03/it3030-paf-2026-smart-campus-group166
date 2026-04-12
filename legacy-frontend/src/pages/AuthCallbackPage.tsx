import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRouteForUser } from '../auth/authRouting';
import type { User } from '../types/auth';

export function AuthCallbackPage() {
  const { refreshSession } = useAuth();
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState('');
  const [resolvedUser, setResolvedUser] = useState<User | null>(null);

  useEffect(() => {
    refreshSession()
      .then((response) => {
        setResolvedUser(response.authenticated ? response.user : null);
      })
      .catch(() => {
        setError('We could not restore your sign-in session after OAuth login.');
      })
      .finally(() => setIsResolving(false));
  }, [refreshSession]);

  if (isResolving) {
    return <div className="loading-state">Signing you in...</div>;
  }

  if (resolvedUser) {
    return <Navigate to={getDefaultRouteForUser(resolvedUser)} replace />;
  }

  if (error) {
    return <Navigate to="/login" replace state={{ reason: 'oauth-session-failed' }} />;
  }

  return <Navigate to="/login" replace />;
}
