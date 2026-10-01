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

async function downloadFile(path) {
  const res = await fetch(`${BASE}${path}`, { headers: buildHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : 'export.csv';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  exportCsv: (status) => downloadFile(`/api/submissions/export.csv${status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''}`),
};
