import { useState, useEffect, Fragment } from 'react';
import { api } from '../lib/api';
import { Badge, Card, Btn, Input, Sel, Label, Toggle } from '../components/ui';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const STATUS_OPTIONS = ['Waitlist', 'Approved', 'Live', 'Rejected'];
const EMPTY_USER = { userName: '', userRole: '', ctUsername: '', rhUserId: '', toggleCTAccess: 'No', toggleRHAccess: 'No' };

function toEditForm(s) {
  return {
    submitterName: s.submitterName || '', submitterTitle: s.submitterTitle || '', submitterEmail: s.submitterEmail || '',
    agencyName: s.agencyName || '', brandName: s.brandName || '', ctAgencyId: s.ctAgencyId || '', rhAgencyId: s.rhAgencyId || '',
    marketingPlatform: s.marketingPlatform || '', artworkBuilder: s.artworkBuilder || '', engageUsage: s.engageUsage || '', rtaUsage: s.rtaUsage || '',
    userName: s.userName || '', userRole: s.userRole || '', ctUsername: s.ctUsername || '', rhUserId: s.rhUserId || '',
    toggleCTAccess: s.toggleCTAccess || 'No', toggleRHAccess: s.toggleRHAccess || 'No',
    additionalUsers: (s.additionalUsers || []).map(u => ({ ...EMPTY_USER, ...u })),
  };
}

export default function SubmissionsAdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [deleting, setDeleting] = useState({});
  const [exporting, setExporting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resending, setResending] = useState({});

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
    Rejected: submissions.filter(s => s.status === 'Rejected').length,
  };

  async function handleSave(id) {
    const cur = submissions.find(s => s.id === id);
    if (!pending[id] || pending[id] === cur?.status) return;
    const newStatus = pending[id];
    if (newStatus === 'Rejected' && !rejectionReasons[id]?.trim()) {
      alert('Please enter a rejection reason before saving.');
      return;
    }
    setSaving(p => ({ ...p, [id]: true }));
    try {
      const updated = await api.updateStatus(id, newStatus, newStatus === 'Rejected' ? rejectionReasons[id] : undefined);
      setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
      setPending(p => { const c = { ...p }; delete c[id]; return c; });
      setRejectionReasons(p => { const c = { ...p }; delete c[id]; return c; });
      setSaved(p => ({ ...p, [id]: true }));
      setTimeout(() => setSaved(p => { const c = { ...p }; delete c[id]; return c; }), 2500);
    } catch (e) {
      alert(e.message || 'Failed to update status');
    } finally {
      setSaving(p => { const c = { ...p }; delete c[id]; return c; });
    }
  }

  async function handleDelete(id, agencyName) {
    if (!confirm(`Permanently delete the submission for "${agencyName}"? This cannot be undone.`)) return;
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await api.deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e) {
      alert(e.message || 'Failed to delete submission');
    } finally {
      setDeleting(p => { const c = { ...p }; delete c[id]; return c; });
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditForm(toEditForm(s));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function setEditField(k, v) {
    setEditForm(f => ({ ...f, [k]: v }));
  }

  function setAdditionalUser(i, patch) {
    setEditForm(f => {
      const u = [...f.additionalUsers];
      u[i] = { ...u[i], ...patch };
      return { ...f, additionalUsers: u };
    });
  }

  function addAdditionalUser() {
    setEditForm(f => ({ ...f, additionalUsers: [...f.additionalUsers, { ...EMPTY_USER }] }));
  }

  function removeAdditionalUser(i) {
    setEditForm(f => {
      const u = [...f.additionalUsers];
      u.splice(i, 1);
      return { ...f, additionalUsers: u };
    });
  }

  async function saveEdit(id) {
    setSavingEdit(true);
    try {
      const updated = await api.adminUpdate(id, editForm);
      setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
      cancelEdit();
    } catch (e) {
      alert(e.message || 'Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleResendTeams(id) {
    setResending(p => ({ ...p, [id]: true }));
    try {
      await api.resendTeamsNotification(id);
      alert('Resent to Teams.');
    } catch (e) {
      alert(e.message || 'Failed to resend Teams notification');
    } finally {
      setResending(p => { const c = { ...p }; delete c[id]; return c; });
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      await api.exportCsv(statusFilter);
    } catch (e) {
      alert(e.message || 'Export failed');
    } finally {
      setExporting(false);
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
        <Btn variant="secondary" onClick={handleExportCsv} disabled={exporting || submissions.length === 0}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting…' : statusFilter === 'All' ? 'Export CSV' : `Export ${statusFilter} CSV`}
          </span>
        </Btn>
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
                        onClick={() => { setExpanded(expanded === s.id ? null : s.id); cancelEdit(); }}
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
                      {(pending[s.id] ?? s.status) === 'Rejected' && (
                        <textarea
                          className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Rejection reason (required)…"
                          value={rejectionReasons[s.id] ?? (pending[s.id] === 'Rejected' ? '' : s.rejectionReason || '')}
                          onChange={e => setRejectionReasons(p => ({ ...p, [s.id]: e.target.value }))}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {pending[s.id] && pending[s.id] !== s.status
                        ? <Btn onClick={() => handleSave(s.id)} disabled={saving[s.id]}>{saving[s.id] ? 'Saving…' : 'Save'}</Btn>
                        : saved[s.id] ? <span className="text-green-600 text-xs font-medium">✓ Saved</span> : null
                      }
                    </td>
                  </tr>
                  {expanded === s.id && editingId === s.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-6 text-xs">
                          <div className="space-y-2">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Submitter</p>
                            <div><Label>Name</Label><Input value={editForm.submitterName} onChange={e => setEditField('submitterName', e.target.value)} /></div>
                            <div><Label>Title</Label><Input value={editForm.submitterTitle} onChange={e => setEditField('submitterTitle', e.target.value)} /></div>
                            <div><Label>Email</Label><Input value={editForm.submitterEmail} onChange={e => setEditField('submitterEmail', e.target.value)} /></div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4">Agency Details</p>
                            <div><Label>Agency Name</Label><Input value={editForm.agencyName} onChange={e => setEditField('agencyName', e.target.value)} /></div>
                            <div><Label>Brand Name</Label><Input value={editForm.brandName} onChange={e => setEditField('brandName', e.target.value)} /></div>
                            <div><Label>CT Agency ID</Label><Input value={editForm.ctAgencyId} onChange={e => setEditField('ctAgencyId', e.target.value)} /></div>
                            <div><Label>RH Agency ID</Label><Input value={editForm.rhAgencyId} onChange={e => setEditField('rhAgencyId', e.target.value)} /></div>
                            <div><Label>Marketing Platform</Label><Sel value={editForm.marketingPlatform} onChange={e => setEditField('marketingPlatform', e.target.value)}><option>Realhub</option><option>Campaigntrack</option></Sel></div>
                            <div><Label>Artwork Builder</Label><Sel value={editForm.artworkBuilder} onChange={e => setEditField('artworkBuilder', e.target.value)}><option>RHAWB</option><option>Other</option></Sel></div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Main User</p>
                            <div><Label>Name</Label><Input value={editForm.userName} onChange={e => setEditField('userName', e.target.value)} /></div>
                            <div><Label>Role</Label><Input value={editForm.userRole} onChange={e => setEditField('userRole', e.target.value)} /></div>
                            <div><Label>CT Username</Label><Input value={editForm.ctUsername} onChange={e => setEditField('ctUsername', e.target.value)} /></div>
                            <div><Label>RH User ID</Label><Input value={editForm.rhUserId} onChange={e => setEditField('rhUserId', e.target.value)} /></div>
                            <Toggle label="CT Access" value={editForm.toggleCTAccess} onChange={v => setEditField('toggleCTAccess', v)} />
                            <Toggle label="RH Access" value={editForm.toggleRHAccess} onChange={v => setEditField('toggleRHAccess', v)} />
                          </div>
                          <div className="space-y-3">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Users</p>
                            {editForm.additionalUsers.map((u, i) => (
                              <div key={i} className="border border-blue-100 rounded-lg p-2 space-y-2 bg-white">
                                <div className="flex justify-end"><button type="button" onClick={() => removeAdditionalUser(i)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button></div>
                                <div><Label>Name</Label><Input value={u.userName} onChange={e => setAdditionalUser(i, { userName: e.target.value })} /></div>
                                <div><Label>Role</Label><Input value={u.userRole} onChange={e => setAdditionalUser(i, { userRole: e.target.value })} /></div>
                                <div><Label>CT Username</Label><Input value={u.ctUsername} onChange={e => setAdditionalUser(i, { ctUsername: e.target.value })} /></div>
                                <div><Label>RH User ID</Label><Input value={u.rhUserId} onChange={e => setAdditionalUser(i, { rhUserId: e.target.value })} /></div>
                              </div>
                            ))}
                            <button type="button" onClick={addAdditionalUser} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                              + Add user
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Btn variant="secondary" onClick={cancelEdit} disabled={savingEdit}>Cancel</Btn>
                          <Btn onClick={() => saveEdit(s.id)} disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save changes'}</Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expanded === s.id && editingId !== s.id && (
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
                            {s.rejectedAt && <p className="mt-2"><span className="text-gray-500">Rejected: </span>{fmtDT(s.rejectedAt)}</p>}
                            {s.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                                <p className="text-gray-500 mb-0.5">Reason:</p>
                                <p className="text-red-700">{s.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <Btn variant="secondary" onClick={() => startEdit(s)}>
                            Edit
                          </Btn>
                          <Btn
                            variant="secondary"
                            onClick={() => handleResendTeams(s.id)}
                            disabled={resending[s.id]}
                          >
                            {resending[s.id] ? 'Resending…' : 'Resend to Teams'}
                          </Btn>
                          <Btn
                            variant="danger"
                            onClick={() => handleDelete(s.id, s.agencyName)}
                            disabled={deleting[s.id]}
                          >
                            {deleting[s.id] ? 'Deleting…' : 'Delete submission'}
                          </Btn>
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
