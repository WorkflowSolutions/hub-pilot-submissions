import { Router } from 'express';
import db from '../db.js';

const router = Router();

function notifyTeams(submission) {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return;
  const card = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'New Hub Pilot Submission',
        weight: 'Bolder',
        size: 'Medium',
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Brand', value: submission.brandName || '—' },
          { title: 'Agency', value: submission.agencyName || '—' },
          { title: 'Platform', value: submission.marketingPlatform || '—' },
          { title: 'Requested User', value: `${submission.userName || '—'} | ${submission.userRole || '—'}` },
          { title: 'Submitted by', value: submission.submitterName || '—' },
        ],
      },
    ],
  };
  const payload = card;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => console.log('[Teams] webhook status:', r.status)).catch(e => console.error('[Teams] webhook error:', e.message));
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function rowToSub(row) {
  if (!row) return null;
  return {
    id: row.id,
    submitterName: row.submitter_name,
    submitterTitle: row.submitter_title,
    submitterEmail: row.submitter_email,
    checkedWaitlist: Boolean(row.checked_waitlist),
    meetsCriteria: Boolean(row.meets_criteria),
    agencyName: row.agency_name,
    brandName: row.brand_name,
    ctAgencyId: row.ct_agency_id,
    rhAgencyId: row.rh_agency_id,
    marketingPlatform: row.marketing_platform,
    artworkBuilder: row.artwork_builder,
    engageUsage: row.engage_usage,
    rtaUsage: row.rta_usage,
    ...JSON.parse(row.main_user || '{}'),
    additionalUsers: JSON.parse(row.additional_users || '[]'),
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    liveAt: row.live_at,
    rejectionReason: row.rejection_reason || null,
    rejectedAt: row.rejected_at || null,
  };
}

// POST /api/submissions — public: new submission
router.post('/', (req, res) => {
  const d = req.body;
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

  db.prepare(`
    INSERT INTO submissions (
      id, submitter_name, submitter_title, submitter_email,
      checked_waitlist, meets_criteria, agency_name, brand_name,
      ct_agency_id, rh_agency_id, marketing_platform, artwork_builder,
      engage_usage, rta_usage, main_user, additional_users, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    d.submitterName, d.submitterTitle, d.submitterEmail,
    d.checkedWaitlist ? 1 : 0, d.meetsCriteria ? 1 : 0,
    d.agencyName, d.brandName,
    d.ctAgencyId || null, d.rhAgencyId || null,
    d.marketingPlatform, d.artworkBuilder,
    d.engageUsage || null, d.rtaUsage || null,
    JSON.stringify({
      userName: d.userName, userRole: d.userRole,
      ctUsername: d.ctUsername || null, rhUserId: d.rhUserId || null,
      toggleCTAccess: d.toggleCTAccess, toggleRHAccess: d.toggleRHAccess,
    }),
    JSON.stringify(d.additionalUsers || []),
    new Date().toISOString()
  );

  const saved = rowToSub(db.prepare('SELECT * FROM submissions WHERE id = ?').get(id));
  notifyTeams(saved);
  res.status(201).json(saved);
});

// POST /api/submissions/lookup — public: find own submission by email + agency name
router.post('/lookup', (req, res) => {
  const { email, agencyName } = req.body;
  if (!email || !agencyName) return res.status(400).json({ error: 'email and agencyName required' });

  const row = db.prepare(
    `SELECT * FROM submissions WHERE lower(submitter_email) = lower(?) AND lower(agency_name) = lower(?)`
  ).get(email.trim(), agencyName.trim());

  if (!row) return res.status(404).json({ error: 'No submission found. Check your email and agency name.' });
  res.json(rowToSub(row));
});

// GET /api/submissions/public — public: read-only view (no submitter email or user details)
router.get('/public', (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC').all();
  res.json(rows.map(row => ({
    id: row.id,
    agencyName: row.agency_name,
    brandName: row.brand_name,
    marketingPlatform: row.marketing_platform,
    artworkBuilder: row.artwork_builder,
    submitterName: row.submitter_name,
    submitterTitle: row.submitter_title,
    status: row.status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    liveAt: row.live_at,
  })));
});

// PUT /api/submissions/:id — public: update own submission (email verified)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const d = req.body;

  const existing = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.submitter_email.toLowerCase() !== (d.submitterEmail || '').toLowerCase()) {
    return res.status(403).json({ error: 'Email mismatch' });
  }

  db.prepare(`
    UPDATE submissions SET
      submitter_name = ?, submitter_title = ?, submitter_email = ?,
      agency_name = ?, brand_name = ?, ct_agency_id = ?, rh_agency_id = ?,
      marketing_platform = ?, artwork_builder = ?, engage_usage = ?, rta_usage = ?,
      main_user = ?, additional_users = ?
    WHERE id = ?
  `).run(
    d.submitterName, d.submitterTitle, d.submitterEmail,
    d.agencyName, d.brandName,
    d.ctAgencyId || null, d.rhAgencyId || null,
    d.marketingPlatform, d.artworkBuilder,
    d.engageUsage || null, d.rtaUsage || null,
    JSON.stringify({
      userName: d.userName, userRole: d.userRole,
      ctUsername: d.ctUsername || null, rhUserId: d.rhUserId || null,
      toggleCTAccess: d.toggleCTAccess, toggleRHAccess: d.toggleRHAccess,
    }),
    JSON.stringify(d.additionalUsers || []),
    id
  );

  res.json(rowToSub(db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)));
});

// GET /api/submissions/export.csv — admin: download all submissions as CSV (one row per user)
// Optional ?status=Approved|Waitlist|Live|Rejected to filter
router.get('/export.csv', requireAdmin, (req, res) => {
  const { status } = req.query;
  const allowed = ['Waitlist', 'Approved', 'Live', 'Rejected'];
  const rows = (status && allowed.includes(status))
    ? db.prepare('SELECT * FROM submissions WHERE status = ? ORDER BY submitted_at ASC').all(status)
    : db.prepare('SELECT * FROM submissions ORDER BY submitted_at ASC').all();

  const csvField = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headers = [
    'Submission ID', 'Submitted At', 'Status',
    'Agency Name', 'Brand Name', 'CT Agency ID', 'RH Agency ID',
    'Marketing Platform', 'Artwork Builder', 'Uses Engage', 'Uses RTA',
    'Submitter Name', 'Submitter Email', 'Submitter Title',
    'User Type', 'User Name', 'User Role', 'CT Username', 'RH User ID', 'CT Access', 'RH Access',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const base = [
      row.id, row.submitted_at, row.status,
      row.agency_name, row.brand_name, row.ct_agency_id || '', row.rh_agency_id || '',
      row.marketing_platform, row.artwork_builder, row.engage_usage || '', row.rta_usage || '',
      row.submitter_name, row.submitter_email, row.submitter_title,
    ];

    const mainUser = JSON.parse(row.main_user || '{}');
    lines.push([
      ...base,
      'Main User',
      mainUser.userName || '', mainUser.userRole || '',
      mainUser.ctUsername || '', mainUser.rhUserId || '',
      mainUser.toggleCTAccess || '', mainUser.toggleRHAccess || '',
    ].map(csvField).join(','));

    const additionalUsers = JSON.parse(row.additional_users || '[]');
    for (const u of additionalUsers) {
      lines.push([
        ...base,
        'Additional User',
        u.userName || '', u.userRole || '',
        u.ctUsername || '', u.rhUserId || '',
        u.toggleCTAccess || '', u.toggleRHAccess || '',
      ].map(csvField).join(','));
    }
  }

  const csv = lines.join('\r\n');
  const filename = `hub-pilot-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv); // BOM so Excel opens UTF-8 correctly
});

// GET /api/submissions — admin: get all
router.get('/', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC').all().map(rowToSub));
});

// PATCH /api/submissions/:id — admin: update status
router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Waitlist', 'Approved', 'Live', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  let approvedAt = existing.approved_at;
  let liveAt = existing.live_at;
  let rejectedAt = existing.rejected_at;
  const rejectionReason = req.body.rejectionReason || null;

  if (status === 'Approved' && !approvedAt) approvedAt = new Date().toISOString();
  if (status === 'Live') {
    liveAt = new Date().toISOString();
    if (!approvedAt) approvedAt = new Date().toISOString();
  }
  if (status === 'Rejected' && !rejectedAt) rejectedAt = new Date().toISOString();

  db.prepare('UPDATE submissions SET status = ?, approved_at = ?, live_at = ?, rejected_at = ?, rejection_reason = ? WHERE id = ?')
    .run(status, approvedAt, liveAt, rejectedAt, rejectionReason, id);

  res.json(rowToSub(db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)));
});

// DELETE /api/submissions/:id — admin: permanently delete a submission
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM submissions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
