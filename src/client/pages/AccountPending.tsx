import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export function AccountPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.merchantId) {
      navigate('/overview', { replace: true });
    }
  }, [navigate, user?.merchantId]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Account created successfully</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your merchant sign-in is active, but it is not yet linked to a merchant profile. A platform administrator must complete that link before any merchant records are available.
        </p>
        {user?.email && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Signed in as {user.email}
          </p>
        )}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
