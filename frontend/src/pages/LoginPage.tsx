import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiBaseUrl } from '../services/api';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('admin@smartcampus.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/admin/users" replace />;
  }

  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error') === 'oauth';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login({ email, password });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
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
        <span className="eyebrow">Smart Campus IAM</span>
        <h1 className="hero-title">Control access before business modules grow.</h1>
        <p className="hero-copy">
          Sign in with the bootstrap admin or connect Google OAuth once your client credentials are
          configured.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {oauthError ? (
            <div className="status-banner error">
              Google sign-in is not available yet. Check your backend OAuth client settings.
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
            Default bootstrap account: <strong>admin@smartcampus.local</strong> /{' '}
            <strong>Admin@12345</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
