import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Card } from '../components/ui';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function WaitlistPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublic()
      .then(data => setSubmissions(data.filter(s => s.status === 'Waitlist')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
          <p className="text-gray-500 text-sm mt-1">{submissions.length} {submissions.length === 1 ? 'agency' : 'agencies'} pending review</p>
        </div>
        <Badge status="Waitlist" />
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && submissions.length === 0 && (
        <Card className="p-12 text-center text-gray-400">
          <p className="text-lg">No agencies on the waitlist yet.</p>
          <p className="text-sm mt-1">Submissions will appear here once received.</p>
        </Card>
      )}

      {!loading && !error && submissions.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Agency Name', 'Marketing Platform', 'Artwork Builder', 'Submitted By', 'Submitted'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.agencyName}
                    <div className="text-xs text-gray-400">{s.brandName}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.marketingPlatform}</td>
                  <td className="px-4 py-3 text-gray-700">{s.artworkBuilder}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.submitterName}
                    <div className="text-xs text-gray-400">{s.submitterTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
