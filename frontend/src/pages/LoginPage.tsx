import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRouteForUser } from '../auth/authRouting';
import { ApiError, getApiBaseUrl } from '../services/api';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('admin@smartcampus.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error') === 'oauth';
  const state = location.state as { from?: string; reason?: string } | null;

  const authMessage =
    state?.reason === 'auth-required'
      ? 'Sign in to continue to the protected Smart Campus area.'
      : state?.reason === 'session-expired'
        ? 'Your session expired. Sign in again to continue.'
        : state?.reason === 'oauth-session-failed'
          ? 'Google sign-in completed, but the app could not restore your session.'
          : '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login({ email, password });
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError && submissionError.status === 401
          ? 'Invalid email or password. Please try again.'
          : submissionError instanceof Error
            ? submissionError.message
          : 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="eyebrow">Smart Campus</span>
        <h1 className="hero-title">Sign in</h1>
        <p className="hero-copy">
          Use your campus account to access the operations workspace.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {authMessage ? <div className="status-banner info">{authMessage}</div> : null}

          {oauthError ? (
            <div className="status-banner error">
              Google sign-in is currently unavailable. Check the backend OAuth configuration.
            </div>
          ) : null}

          {error ? <div className="status-banner error">{error}</div> : null}

          <div className="field">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>
          </div>

          <div className="field">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="stack">
          <div className="auth-divider">or</div>
          <a className="secondary-button" href={`${getApiBaseUrl()}/oauth2/authorization/google`}>
            Continue with Google
          </a>
          <p className="helper-text">
            Bootstrap admin: <strong>admin@smartcampus.local</strong> / <strong>Admin@12345</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
