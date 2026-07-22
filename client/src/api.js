// Small wrapper around axios. Adds the JWT token to every request
// and points at the deployed API when VITE_API_URL is set.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // '' = same origin / vite proxy
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('unifix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
