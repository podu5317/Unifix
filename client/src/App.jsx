// All routes of the app. ProtectedRoute enforces login + role on the frontend.
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute roles={['student']}><NewRequest /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><AdminLogs /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
