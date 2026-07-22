import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Please fill in both fields.');
    try {
      setBusy(true);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-box">
      <h1>Login</h1>
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</button>
      </form>
      <p>No account yet? <Link to="/register">Register here</Link></p>
    </div>
  );
}
