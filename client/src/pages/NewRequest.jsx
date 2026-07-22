// Service request submission form, with optional evidence photo upload.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';

export default function NewRequest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', priority: 'medium' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.category || !form.location) {
      return setError('Please fill in all required fields.');
    }
    try {
      setBusy(true);
      // FormData lets us send the image together with the text fields.
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('evidenceImage', file);
      await api.post('/api/requests', fd);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>Submit a Service Request</h1>
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title *</label>
        <input id="title" value={form.title} onChange={set('title')} placeholder="e.g. Leaking pipe in Hostel B bathroom" />

        <label htmlFor="category">Category *</label>
        <select id="category" value={form.category} onChange={set('category')}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <label htmlFor="location">Location *</label>
        <input id="location" value={form.location} onChange={set('location')} placeholder="Building, room number..." />

        <label htmlFor="priority">Priority</label>
        <select id="priority" value={form.priority} onChange={set('priority')}>
          {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <label htmlFor="description">Description *</label>
        <textarea id="description" value={form.description} onChange={set('description')} placeholder="Describe the problem in detail..." />

        <label htmlFor="evidence">Photo of the fault (optional)</label>
        <input id="evidence" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />

        <button className="btn" disabled={busy}>{busy ? 'Submitting...' : 'Submit Request'}</button>
      </form>
    </div>
  );
}
