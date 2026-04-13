import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getDefaultRouteForUser } from '../auth/authRouting';

export function AccessDeniedPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="auth-layout">
      <div className="auth-card access-card">
        <span className="eyebrow">Permission Required</span>
        <h1 className="hero-title">You do not have access to this page.</h1>
        <p className="hero-copy">
          {from
            ? `Your ${user?.role ?? 'current'} account cannot open ${from}.`
            : 'This route is available to a different role.'}
        </p>

        <div className="stack">
          <div className="status-banner info">
            Signed in as {user?.email} with role <strong>{user?.role}</strong>.
          </div>
          <div className="button-row">
            <Link className="primary-button" to={getDefaultRouteForUser(user)}>
              Go back
            </Link>
            {user?.role === 'ADMIN' ? (
              <Link className="secondary-button" to="/admin/users">
                Open admin users
              </Link>
            ) : null}
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
