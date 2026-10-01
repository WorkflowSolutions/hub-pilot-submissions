import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Card } from '../components/ui';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const STATUS_OPTIONS = ['All', 'Waitlist', 'Approved', 'Live'];

export default function WaitlistPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPublic()
      .then(setSubmissions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = submissions
    .filter(s => statusFilter === 'All' || s.status === statusFilter)
    .filter(s => !search || [s.agencyName, s.brandName, s.marketingPlatform].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  const counts = {
    All: submissions.length,
    Waitlist: submissions.filter(s => s.status === 'Waitlist').length,
    Approved: submissions.filter(s => s.status === 'Approved').length,
    Live: submissions.filter(s => s.status === 'Live').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pilot Agencies</h1>
        <p className="text-gray-500 text-sm mt-1">All agencies submitted to the Hub pilot program</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs w-full"
          placeholder="Search agency or platform…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(f => (
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

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center text-gray-400">
          {submissions.length === 0 ? 'No agencies have been submitted yet.' : 'No agencies match your filters.'}
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Agency', 'Platform', 'Artwork Builder', 'Other Products', 'Status', 'Submitted', 'Approved'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.agencyName}</div>
                    <div className="text-xs text-gray-400">{s.brandName}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.marketingPlatform || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{s.artworkBuilder || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[s.engageUsage === 'Yes' && 'Engage', s.rtaUsage === 'Yes' && 'RTA'].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3"><Badge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.approvedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
