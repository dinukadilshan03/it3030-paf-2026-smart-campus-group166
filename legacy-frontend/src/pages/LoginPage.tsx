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
    <div className="auth-layout login-layout">
      <div className="login-shell">
        <section className="login-form-panel">
          <div className="login-brand">Smart Campus</div>

          <div className="login-copy-block">
            <h1 className="login-title">Sign In</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {authMessage ? <div className="status-banner info">{authMessage}</div> : null}

            {oauthError ? (
              <div className="status-banner error">
                Google sign-in is currently unavailable. Check the backend OAuth configuration.
              </div>
            ) : null}

            {error ? <div className="status-banner error">{error}</div> : null}

            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-secondary-actions">
            <div className="login-divider">or continue with</div>
            <a className="login-oauth-button" href={`${getApiBaseUrl()}/oauth2/authorization/google`}>
              <span className="login-google-badge" aria-hidden="true">
                G
              </span>
              Continue with Google
            </a>
            <p className="login-helper">
              Bootstrap admin: <strong>admin@smartcampus.local</strong> /{' '}
              <strong>Admin@12345</strong>
            </p>
          </div>
        </section>

        <aside className="login-showcase">
          <div className="login-showcase-panel">
            <div className="login-showcase-content">
              <p className="login-showcase-kicker">Smart Campus workspace</p>
              <h2 className="login-showcase-title">What our campus teams say.</h2>
              <p className="login-showcase-quote-mark" aria-hidden="true">
                "
              </p>
              <p className="login-showcase-quote">
                Search, booking, facilities, and support workflows now start from one cleaner
                access point.
              </p>
            </div>
            <div className="login-showcase-illustration-shell">
              <div className="login-showcase-illustration">
                <svg
                  className="login-cap-svg"
                  viewBox="0 0 360 250"
                  role="img"
                  aria-label="University cap illustration"
                >
                  <defs>
                    <linearGradient id="capTop" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3a3d43" />
                      <stop offset="42%" stopColor="#23272d" />
                      <stop offset="100%" stopColor="#0c0f13" />
                    </linearGradient>
                    <linearGradient id="capEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0e1116" />
                      <stop offset="50%" stopColor="#2a2e34" />
                      <stop offset="100%" stopColor="#090c10" />
                    </linearGradient>
                    <linearGradient id="capBase" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2a2e34" />
                      <stop offset="50%" stopColor="#14181d" />
                      <stop offset="100%" stopColor="#07090c" />
                    </linearGradient>
                    <linearGradient id="capBaseFront" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#31353b" />
                      <stop offset="50%" stopColor="#171b20" />
                      <stop offset="100%" stopColor="#0a0d11" />
                    </linearGradient>
                    <linearGradient id="tasselGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f6df89" />
                      <stop offset="35%" stopColor="#efc448" />
                      <stop offset="70%" stopColor="#c18a13" />
                      <stop offset="100%" stopColor="#f2d36f" />
                    </linearGradient>
                    <filter id="capShadow" x="-20%" y="-20%" width="140%" height="160%">
                      <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.22" />
                    </filter>
                  </defs>

                  <g filter="url(#capShadow)">
                    <polygon points="180,30 334,92 180,149 26,92" fill="url(#capTop)" />
                    <polygon points="180,43 312,94 180,143 48,94" fill="#2f3339" opacity="0.45" />
                    <path
                      d="M26 92L180 149L334 92L334 102L180 160L26 102Z"
                      fill="url(#capEdge)"
                    />

                    <path
                      d="M110 129C100 142 96 161 96 198C96 225 129 240 180 240C231 240 264 225 264 198C264 161 260 142 250 129C229 139 206 146 180 151C154 146 131 139 110 129Z"
                      fill="url(#capBase)"
                    />
                    <path
                      d="M104 182C110 166 136 159 180 159C224 159 250 166 256 182V210C247 226 222 234 180 234C138 234 113 226 104 210Z"
                      fill="url(#capBaseFront)"
                    />
                    <path
                      d="M180 151V234"
                      stroke="#0b0e12"
                      strokeWidth="3"
                      strokeOpacity="0.42"
                    />

                    <ellipse cx="182" cy="84" rx="14" ry="11" fill="#1c2025" />
                    <ellipse cx="178" cy="80" rx="10" ry="7" fill="#30343a" opacity="0.48" />

                    <path
                      d="M192 85C220 89 248 97 274 110C287 117 296 128 295 142C294 156 292 175 291 190"
                      stroke="url(#tasselGold)"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />

                    <ellipse cx="290" cy="182" rx="11" ry="14" fill="url(#tasselGold)" />
                    <ellipse cx="290" cy="206" rx="13" ry="16" fill="url(#tasselGold)" />

                    <g stroke="url(#tasselGold)" strokeWidth="3" strokeLinecap="round">
                      <line x1="279" y1="218" x2="274" y2="248" />
                      <line x1="284" y1="219" x2="281" y2="249" />
                      <line x1="289" y1="220" x2="288" y2="250" />
                      <line x1="294" y1="220" x2="295" y2="250" />
                      <line x1="299" y1="219" x2="302" y2="249" />
                      <line x1="304" y1="218" x2="309" y2="248" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
