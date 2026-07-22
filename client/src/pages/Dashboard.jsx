// Role-based dashboard: request list + filters for everyone,
// plus stats cards for admins. Students see "My Requests",
// officers see "Assigned to me", admins see everything.
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', category: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      const { data } = await api.get('/api/requests', { params });
      setRequests(data.requests);
      setPages(data.pagination.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load requests.');
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/api/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    if (user.role === 'admin') {
      api.get('/api/requests/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
    }
  }, [user.role]);

  const title =
    user.role === 'student' ? 'My Requests' :
    user.role === 'officer' ? 'Requests Assigned to Me' : 'All Service Requests';

  return (
    <div>
      <h1>{title}</h1>
      <Alert>{error}</Alert>

      {stats && (
        <div className="stats">
          {['total', 'pending', 'assigned', 'in_progress', 'completed'].map((k) => (
            <div className="stat" key={k}>
              <div className="num">{stats[k]}</div>
              <div className="lbl">{k.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filters">
        <input
          placeholder="Search requests..."
          value={filters.search}
          onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }); }}
        />
        <select value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }); }}>
          <option value="">All statuses</option>
          {['pending', 'assigned', 'in_progress', 'completed', 'rejected'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={filters.category} onChange={(e) => { setPage(1); setFilters({ ...filters, category: e.target.value }); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {user.role === 'student' && <Link className="btn small" to="/new">+ New Request</Link>}
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <p className="muted">No requests found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.title}</td>
                  <td>{r.category?.name}</td>
                  <td>{r.location}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.priority}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td><Link to={`/requests/${r._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <button className="btn small secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn small secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
