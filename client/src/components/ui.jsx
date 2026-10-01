import { Fragment } from 'react';

export function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function Input({ className = '', ...p }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...p}
    />
  );
}

export function Sel({ className = '', children, ...p }) {
  return (
    <select
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}
      {...p}
    >
      {children}
    </select>
  );
}

export function Btn({ variant = 'primary', className = '', ...p }) {
  const v = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v[variant] || v.primary} ${className}`}
      {...p}
    />
  );
}

export function Badge({ status }) {
  const c = {
    Waitlist: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Live: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2">
        {['Yes', 'No'].map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
              value === o
                ? o === 'Yes' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TriToggle({ label, value, onChange }) {
  const colors = {
    Yes: 'bg-green-600 text-white border-green-600',
    No: 'bg-red-500 text-white border-red-500',
    Maybe: 'bg-amber-400 text-white border-amber-400',
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2">
        {['Yes', 'No', 'Maybe'].map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${value === o ? colors[o] : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepBar({ steps, current }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => (
        <Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
              i < current ? 'bg-blue-600 border-blue-600 text-white' :
              i === current ? 'border-blue-600 text-blue-600' :
              'border-gray-300 text-gray-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 text-center max-w-[70px] ${i === current ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-connector mx-2 mb-4 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function RSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">{children}</div>
    </div>
  );
}

export function RRow({ label, value }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-xs">{value || '—'}</span>
    </div>
  );
}
