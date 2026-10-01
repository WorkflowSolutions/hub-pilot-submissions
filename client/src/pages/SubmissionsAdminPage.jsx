import { useState, useEffect, Fragment } from 'react';
import { api } from '../lib/api';
import { Badge, Card, Btn, Input, Sel } from '../components/ui';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const STATUS_OPTIONS = ['Waitlist', 'Approved', 'Live'];

export default function SubmissionsAdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    api.getAll()
      .then(setSubmissions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = submissions
    .filter(s => statusFilter === 'All' || s.status === statusFilter)
    .filter(s => !search || [s.agencyName, s.brandName, s.submitterName, s.submitterEmail].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const counts = {
    All: submissions.length,
    Waitlist: submissions.filter(s => s.status === 'Waitlist').length,
    Approved: submissions.filter(s => s.status === 'Approved').length,
    Live: submissions.filter(s => s.status === 'Live').length,
  };

  async function handleSave(id) {
    const cur = submissions.find(s => s.id === id);
    if (!pending[id] || pending[id] === cur?.status) return;
    setSaving(p => ({ ...p, [id]: true }));
    try {
      const updated = await api.updateStatus(id, pending[id]);
      setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
      setPending(p => { const c = { ...p }; delete c[id]; return c; });
      setSaved(p => ({ ...p, [id]: true }));
      setTimeout(() => setSaved(p => { const c = { ...p }; delete c[id]; return c; }), 2500);
    } catch (e) {
      alert(e.message || 'Failed to update status');
    } finally {
      setSaving(p => { const c = { ...p }; delete c[id]; return c; });
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-500 text-sm">Loading submissions…</div>;
  if (error) return <div className="max-w-6xl mx-auto px-4 py-8 text-red-600 text-sm">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">{submissions.length} total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Input
          className="max-w-xs"
          placeholder="Search agency, name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {['All', ...STATUS_OPTIONS].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f} <span className="ml-1 opacity-60 text-xs">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-gray-400">No submissions found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Agency', 'Platform', 'Submitted By', 'Submitted', 'Status', 'Update', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <Fragment key={s.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        className="font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {s.agencyName} <span className="text-blue-400 text-xs">{expanded === s.id ? '▲' : '▼'}</span>
                      </button>
                      <div className="text-xs text-gray-400">{s.brandName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.marketingPlatform}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.submitterName}
                      <div className="text-xs text-gray-400">{s.submitterEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.submittedAt)}</td>
                    <td className="px-4 py-3"><Badge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <Sel
                        className="w-32"
                        value={pending[s.id] ?? s.status}
                        onChange={e => setPending(p => ({ ...p, [s.id]: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </Sel>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {pending[s.id] && pending[s.id] !== s.status
                        ? <Btn onClick={() => handleSave(s.id)} disabled={saving[s.id]}>{saving[s.id] ? 'Saving…' : 'Save'}</Btn>
                        : saved[s.id] ? <span className="text-green-600 text-xs font-medium">✓ Saved</span> : null
                      }
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-6 text-xs">
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Agency Details</p>
                            <p><span className="text-gray-500">CT Agency ID: </span>{s.ctAgencyId || '—'}</p>
                            <p><span className="text-gray-500">RH Agency ID: </span>{s.rhAgencyId || '—'}</p>
                            <p><span className="text-gray-500">Artwork Builder: </span>{s.artworkBuilder}</p>
                            <p><span className="text-gray-500">Uses Engage: </span>{s.engageUsage || '—'}</p>
                            <p><span className="text-gray-500">Uses RTA: </span>{s.rtaUsage || '—'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Main User</p>
                            <p><span className="text-gray-500">Name: </span>{s.userName}</p>
                            <p><span className="text-gray-500">Role: </span>{s.userRole}</p>
                            <p><span className="text-gray-500">CT Username: </span>{s.ctUsername || '—'}</p>
                            <p><span className="text-gray-500">RH User ID: </span>{s.rhUserId || '—'}</p>
                            <p><span className="text-gray-500">CT Access: </span>{s.toggleCTAccess}</p>
                            <p><span className="text-gray-500">RH Access: </span>{s.toggleRHAccess}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Users &amp; Dates</p>
                            {s.additionalUsers?.length > 0
                              ? s.additionalUsers.map((u, i) => (
                                  <div key={i} className="mb-2 pb-2 border-b border-blue-100 last:border-0">
                                    <p className="font-medium">{u.userName} — {u.userRole}</p>
                                    <p className="text-gray-400">{u.ctUsername || u.rhUserId || ''}</p>
                                  </div>
                                ))
                              : <p className="text-gray-400">None</p>
                            }
                            {s.approvedAt && <p className="mt-2"><span className="text-gray-500">Approved: </span>{fmtDT(s.approvedAt)}</p>}
                            {s.liveAt && <p><span className="text-gray-500">Live: </span>{fmtDT(s.liveAt)}</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
