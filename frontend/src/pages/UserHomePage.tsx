import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const adminFeatures = [
  {
    title: 'Manage users',
    description: 'Create accounts, update roles, and control account status from the admin panel.',
    state: 'Live',
    href: '/admin/users',
  },
    {
    title: 'Resource catalogue',
    description: 'View and manage rooms, labs, equipment, and their current availability details.',
    state: 'Live',
    href: '/resources/catalog',
  },
  {
    title: 'Booking management',
    description: 'Handle booking requests, approvals, rejections, and scheduling conflicts.',
    state: 'Live',
    href: '/admin/bookings',
  },
  {
    title: 'Maintenance tickets',
    description: 'Track incident reports, technician work, comments, and resolutions.',
    state: 'Live',
    href: '/admin/tickets',
  },
  {
    title: 'Notifications',
    description: 'Surface booking updates, ticket activity, and user-facing alerts in one place.',
    state: 'Planned',
  },
];

export function UserHomePage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const authProvider = user?.oauthProvider ?? 'LOCAL';

  if (!isAdmin) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div className="page-shell workspace-page">
      <div className="workspace-dashboard">
        <aside className="workspace-sidebar">
            <div className="workspace-sidebar-block">
              <p className="workspace-kicker">Smart Campus</p>
              <h1 className="workspace-sidebar-title">Admin dashboard</h1>
            </div>

            <div className="workspace-profile-card">
              <p className="workspace-side-label">Signed in as</p>
              <h2 className="workspace-profile-name">{user?.name}</h2>
              <p className="workspace-profile-copy">{user?.email}</p>
              <div className="workspace-chip-stack">
                <span className="workspace-chip">Role: ADMIN</span>
                <span className="workspace-chip">Auth: {authProvider}</span>
                <span className="workspace-chip">Status: {user?.status}</span>
              </div>
            </div>

            <nav className="workspace-nav">
              <Link className="workspace-nav-link active" to="/app">
                Overview
              </Link>
              {adminFeatures.map((feature) =>
                feature.href ? (
                  <Link className="workspace-nav-link" key={feature.title} to={feature.href}>
                    <span>{feature.title}</span>
                    <span className="workspace-nav-state">{feature.state}</span>
                  </Link>
                ) : (
                  <div className="workspace-nav-item" key={feature.title}>
                    <span>{feature.title}</span>
                    <span className="workspace-nav-state">{feature.state}</span>
                  </div>
                )
              )}
            </nav>

        </aside>

        <main className="workspace-main">
            <header className="workspace-topbar">
              <div className="workspace-topbar-copy">
                <h2 className="workspace-main-title"></h2>
              </div>

              <div className="workspace-topbar-actions">
                <button
                  className="workspace-action workspace-action-ghost-dark"
                  onClick={() => logout()}
                >
                  Sign Out
                </button>
              </div>
            </header>

            <section className="workspace-metrics">
              <article className="workspace-metric-card">
                <p className="workspace-metric-label">Email</p>
                <p className="workspace-metric-value">{user?.email}</p>
                <p className="workspace-metric-copy">Current signed-in account</p>
              </article>
              <article className="workspace-metric-card">
                <p className="workspace-metric-label">Role</p>
                <p className="workspace-metric-value">{user?.role}</p>
                <p className="workspace-metric-copy">Administrative access enabled</p>
              </article>
              <article className="workspace-metric-card">
                <p className="workspace-metric-label">Sign-in method</p>
                <p className="workspace-metric-value">{authProvider}</p>
                <p className="workspace-metric-copy">
                  {user?.localAccount ? 'Local account available' : 'OAuth-only account'}
                </p>
              </article>
              <article className="workspace-metric-card">
                <p className="workspace-metric-label">Account status</p>
                <p className="workspace-metric-value">{user?.status}</p>
                <p className="workspace-metric-copy">
                  {user?.department || 'No department assigned'}
                </p>
              </article>
            </section>

            <section className="workspace-surface">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Platform areas</h2>
              </div>

              <div className="admin-module-grid">
                {adminFeatures.map((feature) =>
                  feature.href ? (
                    <Link className="admin-module-card admin-module-card-link" key={feature.title} to={feature.href}>
                      <div className="admin-module-topline">
                        <p className="admin-module-label">{feature.title}</p>
                        <span className="admin-module-state">{feature.state}</span>
                      </div>
                      <p className="admin-module-copy">{feature.description}</p>
                      <span className="admin-module-action">Open</span>
                    </Link>
                  ) : (
                    <article className="admin-module-card" key={feature.title}>
                      <div className="admin-module-topline">
                        <p className="admin-module-label">{feature.title}</p>
                        <span className="admin-module-state">{feature.state}</span>
                      </div>
                      <p className="admin-module-copy">{feature.description}</p>
                    </article>
                  )
                )}
              </div>
            </section>
        </main>
      </div>
    </div>
  );
}