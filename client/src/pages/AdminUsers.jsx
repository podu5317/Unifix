// Admin user management: list users, create officer accounts,
// change roles, activate/deactivate accounts.
import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Alert from '../components/Alert';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'officer', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.password) return setError('Name, email and password are required.');
    try {
      await api.post('/api/users', form);
      setSuccess(`Account created for ${form.email}.`);
      setForm({ name: '', email: '', password: '', role: 'officer', department: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user.');
    }
  };

  const changeRole = async (id, role) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/api/users/${id}`, { role });
      setSuccess('Role updated.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update role.');
    }
  };

  const toggleActive = async (u) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/api/users/${u._id}`, { isActive: !u.isActive });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user.');
    }
  };

  return (
    <div>
      <h1>User Management</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="card">
        <h2>Create an account (e.g. maintenance officer)</h2>
        <form onSubmit={createUser}>
          <label>Full name</label>
          <input value={form.name} onChange={set('name')} />
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} />
          <label>Temporary password</label>
          <input value={form.password} onChange={set('password')} />
          <label>Role</label>
          <select value={form.role} onChange={set('role')}>
            <option value="officer">Maintenance Officer</option>
            <option value="student">Student/Staff</option>
            <option value="admin">Administrator</option>
          </select>
          <button className="btn">Create account</button>
        </form>
      </div>

      <div className="card">
        <h2>All users</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role?.name} onChange={(e) => changeRole(u._id, e.target.value)}>
                    <option value="student">student</option>
                    <option value="officer">officer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.isActive ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn small secondary" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
