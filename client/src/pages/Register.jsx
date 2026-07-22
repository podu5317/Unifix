import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Frontend form validation
    if (!form.name || !form.email || !form.password) return setError('Name, email and password are required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    try {
      setBusy(true);
      await register({ name: form.name, email: form.email, password: form.password, department: form.department });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-box">
      <h1>Create an account</h1>
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={set('name')} />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={set('email')} />
        <label htmlFor="department">Department / Hostel (optional)</label>
        <input id="department" value={form.department} onChange={set('department')} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={set('password')} />
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} />
        <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
      </form>
      <p>Already registered? <Link to="/login">Login here</Link></p>
    </div>
  );
}
