import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ── Profile ──────────────────────────────────────────────────
export const getProfile    = () => api.get('/profile').then(r => r.data);
export const createProfile = (p) => api.post('/profile', p).then(r => r.data);

// ── Trainers ─────────────────────────────────────────────────
export const getTrainers    = () => api.get('/trainers').then(r => r.data);
export const getTrainerInfo = (id) => api.get(`/trainers/${id}`).then(r => r.data);

// ── Clients (trainer) ─────────────────────────────────────────
export const getClients      = () => api.get('/clients').then(r => r.data);
export const getClientLogs   = (clientId) => api.get(`/clients/${clientId}/logs`).then(r => r.data);
export const getClientPhotos = (clientId) => api.get(`/clients/${clientId}/photos`).then(r => r.data);

// ── Logs ──────────────────────────────────────────────────────
export const getLogs = () => api.get('/logs').then(r => r.data);
export const addLog  = (log) => api.post('/logs', log).then(r => r.data);

// ── Photos ────────────────────────────────────────────────────
export const getPhotos      = () => api.get('/photos').then(r => r.data);
export const addPhotoRecord = (photo) => api.post('/photos', photo).then(r => r.data);

export const uploadPhoto = async (file, _userId) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_URL}/photos/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return (await res.json()).url;
};

// ── Messages ──────────────────────────────────────────────────
export const getMessages = (otherUserId) =>
  api.get(`/messages/${otherUserId}`).then(r => r.data);

export const sendMessage = (receiverId, text) =>
  api.post('/messages', { receiver_id: receiverId, text }).then(r => r.data);

// ── Diet Plans ───────────────────────────────────────────────
export const getDietPlan           = () => api.get('/diet').then(r => r.data);
export const getDietPlanForClient  = (clientId) => api.get(`/diet/${clientId}`).then(r => r.data);

export const uploadDietPlan = async (clientId, file, notes = '') => {
  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('notes', notes);
  formData.append('file', file);
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_URL}/diet/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
};
