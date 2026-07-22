// Admin activity log page - the audit trail.
import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Alert from '../components/Alert';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/logs', { params: { page, limit: 20 } });
      setLogs(data.logs);
      setPages(data.pagination.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the activity log.');
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1>Activity Log</h1>
      <Alert>{error}</Alert>
      <div className="card">
        <table>
          <thead>
            <tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.actor?.name}</td>
                <td>{l.action.replace(/_/g, ' ').toLowerCase()}</td>
                <td>{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="btn small secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn small secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
