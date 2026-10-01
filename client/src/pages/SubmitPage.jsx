import { useState } from 'react';
import { api } from '../lib/api';
import { Label, Input, Sel, Btn, Card, Toggle, TriToggle, StepBar, RSection, RRow } from '../components/ui';

const CONTACT_EMAIL = 'angela.yu@costar.com';
const STEPS = ['Your Details', 'Confirm', 'Agency', 'Users', 'Review'];
const EMPTY_USER = { userName: '', userRole: '', ctUsername: '', rhUserId: '', toggleCTAccess: 'No', toggleRHAccess: 'No' };
const EMPTY = {
  submitterName: '', submitterTitle: '', submitterEmail: '',
  checkedWaitlist: false, meetsCriteria: false,
  agencyName: '', brandName: '', ctAgencyId: '', rhAgencyId: '',
  marketingPlatform: '', artworkBuilder: '', engageUsage: '', rtaUsage: '',
  ...EMPTY_USER,
  additionalUsers: [],
};

function UserFields({ user, onChange, onRemove, index }) {
  const set = (k, v) => onChange({ ...user, [k]: v });
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">{index === 0 ? 'Main User' : `Additional User ${index + 1}`}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required={index === 0}>Name</Label><Input value={user.userName} onChange={e => set('userName', e.target.value)} placeholder="John Doe" /></div>
        <div><Label required={index === 0}>Role</Label><Input value={user.userRole} onChange={e => set('userRole', e.target.value)} placeholder="Office Manager" /></div>
        <div><Label>CT Username</Label><Input value={user.ctUsername} onChange={e => set('ctUsername', e.target.value)} placeholder="jdoe@acme.com.au" /></div>
        <div><Label>RH User ID</Label><Input value={user.rhUserId} onChange={e => set('rhUserId', e.target.value)} placeholder="123456" /></div>
      </div>
      <div className="mt-3 border border-gray-100 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Access</p>
        <Toggle label="CT Access" value={user.toggleCTAccess} onChange={v => set('toggleCTAccess', v)} />
        <Toggle label="RH Access" value={user.toggleRHAccess} onChange={v => set('toggleRHAccess', v)} />
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const [mode, setMode] = useState('choose');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupAgency, setLookupAgency] = useState('');
  const [lookupErr, setLookupErr] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (k) => errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>;

  function updateMainUser(patch) { setForm(f => ({ ...f, ...patch })); }
  function updateAdditionalUser(i, patch) {
    setForm(f => { const u = [...f.additionalUsers]; u[i] = { ...u[i], ...patch }; return { ...f, additionalUsers: u }; });
  }
  function addUser() { setForm(f => ({ ...f, additionalUsers: [...f.additionalUsers, { ...EMPTY_USER }] })); }
  function removeUser(i) { setForm(f => { const u = [...f.additionalUsers]; u.splice(i, 1); return { ...f, additionalUsers: u }; }); }

  function validate(s) {
    const e = {};
    if (s === 0) {
      if (!form.submitterName.trim()) e.submitterName = 'Required';
      if (!form.submitterTitle.trim()) e.submitterTitle = 'Required';
      if (!form.submitterEmail.trim()) e.submitterEmail = 'Required';
      else if (!form.submitterEmail.toLowerCase().endsWith('@costar.com')) e.submitterEmail = 'Must be a CoStar email';
    }
    if (s === 2) {
      if (!form.agencyName.trim()) e.agencyName = 'Required';
      if (!form.brandName.trim()) e.brandName = 'Required';
      if (!form.marketingPlatform) e.marketingPlatform = 'Required';
      if (!form.artworkBuilder) e.artworkBuilder = 'Required';
    }
    if (s === 3) {
      if (!form.userName.trim()) e.userName = 'Required';
      if (!form.userRole.trim()) e.userRole = 'Required';
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(s => s + 1);
  }

  async function handleLookup() {
    setLookupErr('');
    try {
      const found = await api.lookup(lookupEmail, lookupAgency);
      setForm({ ...EMPTY, ...found, additionalUsers: found.additionalUsers || [] });
      setEditId(found.id);
      setMode('form');
      setStep(0);
    } catch {
      setLookupErr('No submission found. Check your email and agency name.');
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const entry = editId ? await api.update(editId, form) : await api.submit(form);
      setSubmitted(entry);
      setMode('success');
    } catch (e) {
      alert(e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const mailtoLink = submitted ? (() => {
    const sub = encodeURIComponent(`Hub Pilot Submission Confirmed: ${submitted.agencyName}`);
    const body = encodeURIComponent(
      `Hi ${submitted.submitterName},\n\nThank you for submitting ${submitted.agencyName} to the Hub Pilot program.\n\nYour submission has been added to the waitlist.\n\n• Agency: ${submitted.agencyName}\n• Brand: ${submitted.brandName}\n• Platform: ${submitted.marketingPlatform}\n\nWe'll be in touch.\n\nHub Team`
    );
    return `mailto:${submitted.submitterEmail}?subject=${sub}&body=${body}`;
  })() : '#';

  if (mode === 'choose') return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      <Card className="p-8 text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Submit a Pilot Agency</h2>
        <p className="text-gray-500 text-sm mb-6">Nominate an agency for the Hub pilot program, or update an existing submission.</p>
        <div className="flex flex-col gap-3">
          <Btn onClick={() => { setForm(EMPTY); setEditId(null); setStep(0); setMode('form'); }}>Submit a new agency</Btn>
          <Btn variant="secondary" onClick={() => setMode('lookup')}>Edit an existing submission</Btn>
        </div>
      </Card>
    </div>
  );

  if (mode === 'lookup') return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      <Card className="p-8">
        <button onClick={() => setMode('choose')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">← Back</button>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Find your submission</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your CoStar email and the agency name you submitted.</p>
        <div className="space-y-4">
          <div><Label required>Your CoStar email</Label><Input value={lookupEmail} onChange={e => setLookupEmail(e.target.value)} placeholder="you@costar.com" /></div>
          <div><Label required>Agency name</Label><Input value={lookupAgency} onChange={e => setLookupAgency(e.target.value)} placeholder="Exact agency name as submitted" /></div>
          {lookupErr && <p className="text-red-600 text-sm">{lookupErr}</p>}
          <Btn onClick={handleLookup} className="w-full">Find my submission</Btn>
        </div>
      </Card>
    </div>
  );

  if (mode === 'success') return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      <Card className="p-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{editId ? 'Submission updated!' : 'Submitted successfully!'}</h2>
        <p className="text-gray-500 text-sm mb-2"><strong>{submitted?.agencyName}</strong> has been added to the waitlist.</p>
        <p className="text-gray-500 text-sm mb-6">Angela / Rob will review your submission and be in touch.</p>
        <div className="flex flex-col gap-3">
          <a href={mailtoLink} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send confirmation email
          </a>
          <Btn variant="secondary" onClick={() => { setMode('choose'); setForm(EMPTY); setStep(0); }}>Submit another agency</Btn>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 pb-12">
      <div className="mb-6">
        <button onClick={() => setMode('choose')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{editId ? 'Edit Submission' : 'Submit a Pilot Agency'}</h1>
      </div>
      <StepBar steps={STEPS} current={step} />
      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your details</h2>
            <div><Label required>Full name</Label><Input value={form.submitterName} onChange={e => set('submitterName', e.target.value)} placeholder="Jane Smith" />{err('submitterName')}</div>
            <div><Label required>Title / Role</Label><Input value={form.submitterTitle} onChange={e => set('submitterTitle', e.target.value)} placeholder="Senior Account Manager" />{err('submitterTitle')}</div>
            <div><Label required>CoStar email</Label><Input type="email" value={form.submitterEmail} onChange={e => set('submitterEmail', e.target.value)} placeholder="you@costar.com" />{err('submitterEmail')}</div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Before you proceed</h2>
            <p className="text-sm text-gray-500 mb-6">Please confirm both of the following before submitting.</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600" checked={form.checkedWaitlist} onChange={e => set('checkedWaitlist', e.target.checked)} />
                <span className="text-sm text-gray-700">I have checked the <strong>Waitlist</strong> and confirmed this agency has not already been submitted.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600" checked={form.meetsCriteria} onChange={e => set('meetsCriteria', e.target.checked)} />
                <span className="text-sm text-gray-700">I have confirmed this agency <strong>meets the Hub pilot criteria</strong>.</span>
              </label>
            </div>
            {(!form.checkedWaitlist || !form.meetsCriteria) && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">Not sure if your agency qualifies?</p>
                <p className="text-sm text-amber-700 mt-1">Please chat with <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline">Angela Yu</a> before proceeding.</p>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agency details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label required>Agency Name</Label><Input value={form.agencyName} onChange={e => set('agencyName', e.target.value)} placeholder="Acme Real Estate" />{err('agencyName')}</div>
              <div className="col-span-2"><Label required>Brand Name</Label><Input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="Acme" />{err('brandName')}</div>
              <div><Label>Campaigntrack Agency ID</Label><Input value={form.ctAgencyId} onChange={e => set('ctAgencyId', e.target.value)} placeholder="CT-12345" /></div>
              <div><Label>Realhub Agency ID</Label><Input value={form.rhAgencyId} onChange={e => set('rhAgencyId', e.target.value)} placeholder="RH-67890" /></div>
              <div><Label required>Marketing Platform</Label><Sel value={form.marketingPlatform} onChange={e => set('marketingPlatform', e.target.value)}><option value="">Select platform…</option><option>Realhub</option><option>Campaigntrack</option></Sel>{err('marketingPlatform')}</div>
              <div><Label required>Artwork Builder</Label><Sel value={form.artworkBuilder} onChange={e => set('artworkBuilder', e.target.value)}><option value="">Select…</option><option>RHAWB</option><option>Other</option></Sel>{err('artworkBuilder')}</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Other Products</p>
              <TriToggle label="Agency uses Engage" value={form.engageUsage} onChange={v => set('engageUsage', v)} />
              <TriToggle label="Agency uses RTA" value={form.rtaUsage} onChange={v => set('rtaUsage', v)} />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User details</h2>
            <UserFields
              user={{ userName: form.userName, userRole: form.userRole, ctUsername: form.ctUsername, rhUserId: form.rhUserId, toggleCTAccess: form.toggleCTAccess, toggleRHAccess: form.toggleRHAccess }}
              onChange={updateMainUser}
              index={0}
            />
            {form.additionalUsers.map((u, i) => (
              <UserFields key={i} user={u} onChange={patch => updateAdditionalUser(i, patch)} onRemove={() => removeUser(i)} index={i + 1} />
            ))}
            {errors.userName && <p className="text-red-500 text-xs">{errors.userName}</p>}
            {errors.userRole && <p className="text-red-500 text-xs">{errors.userRole}</p>}
            <button type="button" onClick={addUser} className="w-full mt-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add another user
            </button>
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review your submission</h2>
            <div className="space-y-4 text-sm">
              <RSection title="Submitter">
                <RRow label="Name" value={form.submitterName} />
                <RRow label="Title" value={form.submitterTitle} />
                <RRow label="Email" value={form.submitterEmail} />
              </RSection>
              <RSection title="Agency">
                <RRow label="Agency Name" value={form.agencyName} />
                <RRow label="Brand Name" value={form.brandName} />
                <RRow label="CT Agency ID" value={form.ctAgencyId} />
                <RRow label="RH Agency ID" value={form.rhAgencyId} />
                <RRow label="Marketing Platform" value={form.marketingPlatform} />
                <RRow label="Artwork Builder" value={form.artworkBuilder} />
                <RRow label="Uses Engage" value={form.engageUsage} />
                <RRow label="Uses RTA" value={form.rtaUsage} />
              </RSection>
              <RSection title="Main User">
                <RRow label="Name" value={form.userName} />
                <RRow label="Role" value={form.userRole} />
                <RRow label="CT Username" value={form.ctUsername} />
                <RRow label="RH User ID" value={form.rhUserId} />
                <RRow label="CT Access" value={form.toggleCTAccess} />
                <RRow label="RH Access" value={form.toggleRHAccess} />
              </RSection>
              {form.additionalUsers.map((u, i) => (
                <RSection key={i} title={`Additional User ${i + 1}`}>
                  <RRow label="Name" value={u.userName} />
                  <RRow label="Role" value={u.userRole} />
                  <RRow label="CT Username" value={u.ctUsername} />
                  <RRow label="RH User ID" value={u.rhUserId} />
                  <RRow label="CT Access" value={u.toggleCTAccess} />
                  <RRow label="RH Access" value={u.toggleRHAccess} />
                </RSection>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between mt-8">
          <Btn variant="secondary" onClick={() => step === 0 ? setMode('choose') : setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </Btn>
          {step < STEPS.length - 1
            ? <Btn onClick={next} disabled={step === 1 && (!form.checkedWaitlist || !form.meetsCriteria)}>Next →</Btn>
            : <Btn onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : editId ? 'Save changes' : 'Submit agency'}</Btn>
          }
        </div>
      </Card>
    </div>
  );
}
