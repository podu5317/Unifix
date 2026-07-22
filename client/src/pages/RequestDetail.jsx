// Request tracking page: full details, history timeline, and role-specific
// actions (admin assigns officers; officers update status).
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [officerId, setOfficerId] = useState('');
  const [newStatus, setNewStatus] = useState('in_progress');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/requests/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the request.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/api/users?role=officer').then(({ data }) => setOfficers(data.users)).catch(() => {});
    }
  }, [user.role]);

  const assign = async () => {
    setError(''); setSuccess('');
    if (!officerId) return setError('Please choose an officer.');
    try {
      await api.put(`/api/requests/${id}/assign`, { officerId, note });
      setSuccess('Request assigned successfully.');
      setNote('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const updateStatus = async () => {
    setError(''); setSuccess('');
    try {
      await api.put(`/api/requests/${id}/status`, { status: newStatus, note });
      setSuccess('Status updated.');
      setNote('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/api/requests/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  if (!data) return <Alert>{error || 'Loading...'}</Alert>;
  const r = data.request;

  const canDelete = user.role === 'admin' || (user.id === r.requester?._id && r.status === 'pending');
  const canUpdateStatus = user.role === 'admin' || (user.role === 'officer' && r.assignedTo?._id === user.id);
  const imgBase = import.meta.env.VITE_API_URL || '';

  return (
    <div>
      <div className="detail-head">
        <h1>{r.title}</h1>
        <StatusBadge status={r.status} />
      </div>
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="card">
        <div className="meta-grid">
          <div className="meta-item">
            <div className="meta-label">Category</div>
            <div className="meta-value">{r.category?.name}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Priority</div>
            <div className="meta-value" style={{ textTransform: 'capitalize' }}>{r.priority}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Location</div>
            <div className="meta-value">{r.location}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Submitted by</div>
            <div className="meta-value">{r.requester?.name}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Assigned to</div>
            <div className="meta-value">{r.assignedTo ? r.assignedTo.name : 'Not yet assigned'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Submitted on</div>
            <div className="meta-value">{new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="detail-section">
          <div className="meta-label">Description</div>
          <p className="detail-desc">{r.description}</p>
        </div>

        {r.evidenceImage && (
          <div className="detail-section">
            <div className="meta-label">Evidence photo</div>
            <img className="evidence-img" src={`${imgBase}${r.evidenceImage}`} alt="Evidence of the fault" />
          </div>
        )}
        {canDelete && <button className="btn danger small" onClick={remove}>Delete request</button>}
      </div>

      {user.role === 'admin' && (
        <div className="card">
          <h2>Assign to a maintenance officer</h2>
          <select value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
            <option value="">Choose officer...</option>
            {officers.map((o) => <option key={o._id} value={o._id}>{o.name} ({o.email})</option>)}
          </select>
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Instructions for the officer" />
          <button className="btn" onClick={assign}>Assign</button>
        </div>
      )}

      {canUpdateStatus && (
        <div className="card">
          <h2>Update progress</h2>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done?" />
          <button className="btn" onClick={updateStatus}>Update status</button>
        </div>
      )}

      <div className="card">
        <h2>History</h2>
        <ul className="history">
          {data.history.map((h) => (
            <li key={h._id}>
              <strong style={{ textTransform: 'capitalize' }}>{h.action.replace(/_/g, ' ').toLowerCase()}</strong> — {h.details}
              <div className="when">{h.actor?.name} · {new Date(h.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
