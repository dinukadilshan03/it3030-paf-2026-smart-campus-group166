import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const studentQuickActions = [
  {
    title: 'Book Resources',
    description: 'Start a new booking request for lecture halls, labs, and shared spaces.',
    action: 'Book now',
    href: '/admin/bookings',
  },
  {
    title: 'Browse Resources',
    description: 'Find classrooms, labs, and campus facilities you can use.',
    action: 'Open resources',
    href: '/resources/list',
  },
  {
    title: 'University Help Desk',
    description: 'Contact the Smart Campus support team for account or system help.',
    action: 'Email help desk',
    href: 'mailto:helpdesk@smartcampus.edu',
    external: true,
  },
  {
    title: 'Support Hotline',
    description: 'Call help desk for urgent technical issues during office hours.',
    action: 'Call now',
    href: 'tel:+94112345678',
    external: true,
  },
];

export function StudentDashboardPage() {
  const { user, logout } = useAuth();

  if (user?.role === 'ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="page-shell student-page">
      <div className="app-shell">
        <header className="topbar panel student-topbar">
          <div>
            <span className="eyebrow">Smart Campus University</span>
            <h1>Student Help Desk</h1>
            <p>
              Welcome {user?.name}. Access basic tools and support services from one place.
            </p>
          </div>
          <div className="button-row">
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="stat-row">
          <article className="stat-card">
            <p className="stat-label">Email</p>
            <p className="stat-value compact">{user?.email}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Role</p>
            <p className="stat-value">{user?.role}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Department</p>
            <p className="stat-value">{user?.department || 'Not assigned'}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Account status</p>
            <p className="stat-value">{user?.status}</p>
          </article>
        </section>

        <section className="student-grid">
          {studentQuickActions.map((action) => (
            <article className="student-card" key={action.title}>
              <span className="eyebrow">Quick action</span>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              {action.external ? (
                <a className="primary-button" href={action.href}>
                  {action.action}
                </a>
              ) : (
                <Link className="primary-button" to={action.href}>
                  {action.action}
                </Link>
              )}
            </article>
          ))}
        </section>

        <section className="panel student-help-panel">
          <span className="eyebrow">Help Desk Info</span>
          <h2 className="section-title">Smart Campus support hours</h2>
          <p className="muted">Monday to Friday: 8:30 AM to 5:00 PM</p>
          <p className="muted">Saturday: 9:00 AM to 1:00 PM</p>
          <p className="muted">Email: helpdesk@smartcampus.edu</p>
          <p className="muted">Phone: +94 11 234 5678</p>
        </section>
      </div>
    </div>
  );
}
