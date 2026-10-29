import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  ShieldCheck,
  ArrowUpRight,
  Receipt,
  History,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  LogOut,
  Database,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { seedDemoData, resetPlatformState } from '../services/api.js';

interface AppLayoutProps {
  children: React.ReactNode;
  onOpenCreateOrder: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onOpenCreateOrder,
  onRefreshData,
  isRefreshing,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDemoActionLoading, setIsDemoActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { user, role, isAdmin, isMerchant, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items based on role
  const navItems = [
    {
      name: isMerchant ? 'Merchant Portal' : 'Overview',
      path: '/overview',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MERCHANT', 'OPERATOR'],
    },
    {
      name: 'Sub-Merchants',
      path: '/merchants',
      icon: Building2,
      roles: ['ADMIN', 'OPERATOR'], // Hidden from sub-merchants to maintain isolation
    },
    {
      name: isMerchant ? 'My Split Orders' : 'Orders & Splits',
      path: '/orders',
      icon: ShoppingCart,
      roles: ['ADMIN', 'MERCHANT', 'OPERATOR'],
    },
    {
      name: 'Escrow & Milestones',
      path: '/escrow',
      icon: ShieldCheck,
      roles: ['ADMIN', 'MERCHANT', 'OPERATOR'],
    },
    {
      name: isMerchant ? 'My Bank Payouts' : 'Payouts',
      path: '/payouts',
      icon: ArrowUpRight,
      roles: ['ADMIN', 'MERCHANT', 'OPERATOR'],
    },
    {
      name: 'Ledger Journal',
      path: '/transactions',
      icon: Receipt,
      roles: ['ADMIN', 'MERCHANT', 'OPERATOR'],
    },
    {
      name: 'Audit Trail',
      path: '/audit-logs',
      icon: History,
      roles: ['ADMIN', 'OPERATOR'],
    },
    {
      name: 'System Architecture',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'OPERATOR'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const handleSeed = async () => {
    if (!window.confirm('Seed database with realistic multi-merchant demo orders, escrow milestones, and ledger transactions?')) {
      return;
    }
    setIsDemoActionLoading(true);
    setActionNotice(null);
    try {
      const res = await seedDemoData();
      setActionNotice({ type: 'success', message: res.message || 'Demo dataset populated successfully.' });
      onRefreshData?.();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to seed demo data.' });
    } finally {
      setIsDemoActionLoading(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset database to clean zero state? This clears all orders and payouts so you can inspect empty states and fresh workflows.')) {
      return;
    }
    setIsDemoActionLoading(true);
    setActionNotice(null);
    try {
      const res = await resetPlatformState();
      setActionNotice({ type: 'success', message: res.message || 'Platform state reset to clean zero-state.' });
      onRefreshData?.();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to reset platform state.' });
    } finally {
      setIsDemoActionLoading(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside
        className={`shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
            {!collapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight text-sm block leading-none">
                    EscrowHub
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                    {isMerchant ? 'Merchant Portal' : 'Marketplace Orchestrator'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/overview' && location.pathname === '/');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                  isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user?.name || 'Authorized User'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {user?.role === 'ADMIN' ? 'Platform Administrator' : user?.merchant?.businessName || 'Sub-Merchant'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
          {/* Left indicator: Environment & Sandbox Notice */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800">PostgreSQL</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-600 text-[11px]">INR Integer Paise</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50/70 border border-indigo-100 text-indigo-700 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulated Escrow Sandbox</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Demo Data Controls for Admin */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={handleSeed}
                  disabled={isDemoActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Populate test database with 8 realistic merchants and 20 multi-split orders"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Seed Demo Data</span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={isDemoActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Reset database to clean zero-state to test empty screens"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clean Zero State</span>
                </button>
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Refresh financial state"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Admin Order Creation */}
            {isAdmin && (
              <button
                onClick={onOpenCreateOrder}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Split Order</span>
              </button>
            )}
          </div>
        </header>

        {/* Action feedback notice banner */}
        {actionNotice && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionNotice.message}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold hover:underline cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Container */}
        <main className="p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
