import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Card } from '../components/ui';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ApprovedLivePage() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.getPublic()
      .then(data => setAllData(data.filter(s => s.status === 'Approved' || s.status === 'Live')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? allData : allData.filter(s => s.status === filter);
  const counts = {
    All: allData.length,
    Approved: allData.filter(s => s.status === 'Approved').length,
    Live: allData.filter(s => s.status === 'Live').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved &amp; Live</h1>
          <p className="text-gray-500 text-sm mt-1">{counts.All} {counts.All === 1 ? 'agency' : 'agencies'}</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Approved', 'Live'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
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
          No agencies {filter !== 'All' ? `with status "${filter}"` : 'approved yet'}.
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Agency Name', 'Marketing Platform', 'Status', 'Approved', 'Live'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered
                .sort((a, b) => new Date(b.approvedAt || b.submittedAt) - new Date(a.approvedAt || a.submittedAt))
                .map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.agencyName}
                      <div className="text-xs text-gray-400">{s.brandName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.marketingPlatform}</td>
                    <td className="px-4 py-3"><Badge status={s.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.approvedAt)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.liveAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
