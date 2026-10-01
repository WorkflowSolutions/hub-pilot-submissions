const BASE = import.meta.env.VITE_API_URL || '';

function buildHeaders(extra = {}) {
  const token = localStorage.getItem('hub_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: buildHeaders(opts.headers) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  login: (password) => req('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  submit: (data) => req('/api/submissions', { method: 'POST', body: JSON.stringify(data) }),
  lookup: (email, agencyName) => req('/api/submissions/lookup', { method: 'POST', body: JSON.stringify({ email, agencyName }) }),
  update: (id, data) => req(`/api/submissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPublic: () => req('/api/submissions/public'),
  getAll: () => req('/api/submissions'),
  updateStatus: (id, status, rejectionReason) => req(`/api/submissions/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ...(rejectionReason ? { rejectionReason } : {}) }) }),
  deleteSubmission: (id) => req(`/api/submissions/${id}`, { method: 'DELETE' }),
};
