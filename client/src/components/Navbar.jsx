import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">🔧 UniFix</Link>
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
