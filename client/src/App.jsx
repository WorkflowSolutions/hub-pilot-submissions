import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SubmitPage from './pages/SubmitPage';
import LoginPage from './pages/LoginPage';
import WaitlistPage from './pages/WaitlistPage';
import ApprovedLivePage from './pages/ApprovedLivePage';
import SubmissionsAdminPage from './pages/SubmissionsAdminPage';

function Nav({ page, setPage }) {
  const { role, logout, isAdmin } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">H</div>
          <span className="font-semibold text-gray-900">Hub Pilot</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage('submit')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 'submit' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Submit Agency
          </button>
          <button
            onClick={() => setPage('waitlist')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 'waitlist' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Waitlist
          </button>
          <button
            onClick={() => setPage('approved')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 'approved' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Approved &amp; Live
          </button>
          {isAdmin && (
            <button
              onClick={() => setPage('admin')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Submissions
            </button>
          )}
          {role ? (
            <button
              onClick={() => { logout(); setPage('submit'); }}
              className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => setPage('login')}
              className={`ml-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 'login' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppInner() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState('submit');

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav page={page} setPage={setPage} />
      {page === 'submit' && <SubmitPage />}
      {page === 'waitlist' && <WaitlistPage />}
      {page === 'approved' && <ApprovedLivePage />}
      {page === 'login' && (
        <LoginPage onSuccess={(role) => setPage(role === 'admin' ? 'admin' : 'submit')} />
      )}
      {page === 'admin' && (
        isAdmin
          ? <SubmissionsAdminPage />
          : <LoginPage onSuccess={(role) => { if (role === 'admin') setPage('admin'); }} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
