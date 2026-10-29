import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';

export function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your current session account (<span className="font-mono font-medium text-slate-800">{user?.email}</span>)
            with role <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">{user?.role}</span> does
            not possess permissions to access this administrative portal section.
          </p>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700 mb-1">Role-Based Access Policy:</div>
            <div>• <strong className="text-slate-800">Administrator:</strong> Full access to merchant onboarding, split creations, and financial disbursements.</div>
            <div>• <strong className="text-slate-800">Sub-Merchant:</strong> Isolated access strictly bounded to tenant allocations and bank payouts.</div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/overview')}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Permitted Dashboard</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
