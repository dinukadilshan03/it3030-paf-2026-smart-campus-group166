import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function UserHomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="page-shell">
      <div className="app-shell">
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Smart Campus</span>
            <h1>Workspace</h1>
            <p>
              Signed in as {user?.name} with the <strong>{user?.role}</strong> role.
            </p>
          </div>

          {/* ✅ BUTTON SECTION */}
          <div className="button-row">

            {/* 🆕 RESOURCES */}
            <Link className="secondary-button" to="/resources">
              Resources
            </Link>
            
            

          

            {/* EXISTING ADMIN BUTTON */}
            {user?.role === 'ADMIN' ? (
              <Link className="secondary-button" to="/admin/users">
                Manage users
              </Link>
            ) : null}

            {/* LOGOUT */}
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>

          </div>
        </header>

        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Email</p>
            <p className="stat-value compact">{user?.email}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Role</p>
            <p className="stat-value">{user?.role}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Sign-in method</p>
            <p className="stat-value">{user?.oauthProvider ?? 'LOCAL'}</p>
          </div>
        </section>

        <section className="feature-grid">
          <article className="info-card">
            <span className="eyebrow">Access</span>
            <h3>Protected route active</h3>
            <p>
              This page is available only to authenticated users. Admin-only areas remain protected
              by role checks.
            </p>
          </article>
          <article className="info-card">
            <span className="eyebrow">Status</span>
            <h3>Session restored correctly</h3>
            <p>
              Your current account is loaded from the active session and can be used as the base for
              future module pages.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}