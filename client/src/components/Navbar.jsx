import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Professional app mark: wrench icon in a rounded badge + wordmark.
function Logo() {
  return (
    <span className="logo-badge" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <Logo />
        <span>Uni<span className="brand-accent">Fix</span></span>
      </Link>
      <nav>
        {user ? (
          <>
            <Link to="/">Dashboard</Link>
            {user.role === 'student' && <Link to="/new">New Request</Link>}
            {user.role === 'admin' && <Link to="/admin/users">Users</Link>}
            {user.role === 'admin' && <Link to="/admin/logs">Activity Log</Link>}
            <span className="who">{user.name} ({user.role})</span>
            <button className="btn small secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
