import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Layers, Building2, ArrowUpRight, Scale, Server } from 'lucide-react';
import { SystemHealth } from '../types/index.js';

interface NavbarProps {
  health: SystemHealth | null;
  onOpenCreateEscrow: () => void;
  onOpenCreateMerchant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenCreateEscrow,
  onOpenCreateMerchant,
}) => {
  const isConnected = health?.database.connected ?? false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Platform Name */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-100 tracking-tight text-base block leading-none">
                  EscrowHub
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  Sub-Merchant Clearing
                </span>
              </div>
            </NavLink>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/escrows"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                Escrows
              </NavLink>

              <NavLink
                to="/merchants"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                Sub-Merchants
              </NavLink>

              <NavLink
                to="/disbursements"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                Disbursements
              </NavLink>

              <NavLink
                to="/disputes"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                Disputes
              </NavLink>

              <NavLink
                to="/architecture"
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Stack & DB</span>
              </NavLink>
            </nav>
          </div>

          {/* Database connection badge & Quick actions */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/architecture"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">PostgreSQL + Prisma</span>
              <span className="text-slate-500 text-[10px]">
                {isConnected ? 'LIVE' : 'CONTAINER READY'}
              </span>
            </NavLink>

            <button
              onClick={onOpenCreateMerchant}
              className="px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Onboard Merchant</span>
            </button>

            <button
              onClick={onOpenCreateEscrow}
              className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Initiate Escrow</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
