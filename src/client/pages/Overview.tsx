import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Plus,
  ShieldCheck,
  Building2,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { DashboardSummary } from '../types/fintech.js';
import { fetchDashboardSummary, seedDemoData } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.js';

interface OverviewProps {
  onOpenCreateOrder: () => void;
  onOpenInitiatePayout?: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ onOpenCreateOrder, onOpenInitiatePayout }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const { user, isAdmin, isMerchant } = useAuth();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query database summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedFromEmpty = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to seed demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Synchronizing PostgreSQL Financial Ledger...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <div className="font-semibold text-sm mb-1 text-rose-900">Failed to Load Dashboard State</div>
        <p className="mb-4 text-rose-700">{error || 'Unknown error occurred while querying database.'}</p>
        <button
          onClick={loadSummary}
          className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold cursor-pointer shadow-xs transition-colors"
        >
          Retry Database Query
        </button>
      </div>
    );
  }

  const { metrics, volumeOverTime, payoutStatusDistribution, operationalAlerts, recentTransactions } = data;
  const isMerchantView = data.isMerchantView || isMerchant;

  // Check if completely empty zero-state
  const isZeroState = metrics.totalOrdersCount === 0 && metrics.totalPaymentVolumePaise === 0;

  // Chart formatting
  const chartData = volumeOverTime.map((item) => ({
    name: item.month,
    Volume: Math.round(item.volumePaise / 100),
    Disbursed: Math.round(item.disbursedPaise / 100),
    Commission: Math.round(item.platformCommissionPaise / 100),
  }));

  const barData = payoutStatusDistribution.map((item) => ({
    name: item.status,
    count: item.count,
    amountRupees: Math.round(item.totalPaise / 100),
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isMerchantView
                ? `${data.merchantName || user?.merchant?.businessName || 'Sub-Merchant'} Portal`
                : 'Escrow Operations & Settlement Overview'}
            </h1>
            {isMerchantView ? (
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Isolated Tenant View
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                Marketplace Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isMerchantView
              ? 'Showing real-time escrow holdings, deliverable milestone releases, and bank transfer dispatches for this merchant entity.'
              : 'RBI-compliant marketplace split orchestration, double-entry custodial ledger, and sub-merchant payout pipelines.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Split Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State Banner when 0 records exist */}
      {isZeroState && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Platform Database is in Clean Zero-State</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            There are currently no marketplace orders, escrow holdings, or banking payouts registered in the ledger.
            You can create a new split order manually or seed realistic demo data to simulate the full multi-merchant workflow.
          </p>

          <div className="flex items-center justify-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={handleSeedFromEmpty}
                  disabled={isSeeding}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isSeeding ? 'Seeding Demo Dataset...' : 'Load Demo Presentation Data'}</span>
                </button>
                <button
                  onClick={onOpenCreateOrder}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Single Split Order</span>
                </button>
              </>
            )}
            {isMerchantView && (
              <p className="text-xs text-slate-500 italic">
                Waiting for marketplace administrator to allocate orders to your merchant account.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isMerchantView ? 'Gross Cart Allocation' : 'Total Gross Volume'}
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatPaise(metrics.totalPaymentVolumePaise)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{metrics.totalOrdersCount}</span>
            <span>{isMerchantView ? 'allocated orders' : 'orders processed'}</span>
          </div>
        </div>

        {/* Metric 2: Escrow Held */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isMerchantView ? 'My Funds On Hold' : 'Escrow Vault (On Hold)'}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">
            {formatPaise(metrics.totalAwaitingReleasePaise)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Awaiting deliverable approvals</span>
          </div>
        </div>

        {/* Metric 3: Completed Disbursals */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isMerchantView ? 'Disbursed to Bank' : 'Settled to Merchants'}
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatPaise(metrics.totalCompletedPayoutsPaise)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Bank cleared via NEFT/RTGS</span>
          </div>
        </div>

        {/* Metric 4: Pending Payouts / Active Partners */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isMerchantView ? 'Pending Transfer' : 'Sub-Merchant Partners'}
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              {isMerchantView ? <ArrowUpRight className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {isMerchantView
              ? formatPaise(metrics.totalPendingPayoutsPaise)
              : `${metrics.activeMerchantsCount} Active`}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            {isMerchantView ? (
              <span>In clearance pipeline</span>
            ) : (
              <span>KYC verified & active</span>
            )}
          </div>
        </div>
      </div>

      {/* Operational Warnings / Action required (if any) */}
      {operationalAlerts.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Operational Clearance Items ({operationalAlerts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operationalAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
                  alert.level === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    alert.level === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{alert.title}</div>
                  <div className="text-xs mt-0.5 text-slate-600">{alert.description}</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span>Ref: {alert.relatedEntity}</span>
                    <span>·</span>
                    <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts & Distributions */}
      {!isZeroState && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: Volume & Escrow Settlements over time */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Financial Velocity & Escrow Releases</h2>
                <p className="text-xs text-slate-500">Monthly gross transaction volume vs settled payouts in ₹</p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                INR (₹)
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="disbGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="Volume"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#volGradient)"
                    name="Gross Volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="Disbursed"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#disbGradient)"
                    name="Settled Payouts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Card: Payout Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Banking Payout Statuses</h2>
              <p className="text-xs text-slate-500 mb-4">Outbound transfer distribution</p>

              <div className="space-y-3">
                {barData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.name === 'PROCESSED'
                            ? 'bg-emerald-500'
                            : item.name === 'PENDING'
                            ? 'bg-amber-500'
                            : item.name === 'IN_TRANSIT'
                            ? 'bg-indigo-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        ₹{item.amountRupees.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.count} payouts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                to="/payouts"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <span>View All Bank Transfers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Ledger Entries (Double Entry Journal Table) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Double-Entry Ledger Postings</h2>
            <p className="text-xs text-slate-500">Immutable debit & credit journal legs verifying financial conservation</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No ledger transactions posted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Journal Ref</th>
                  <th className="py-2.5 px-4">Account Name</th>
                  <th className="py-2.5 px-4">Leg</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4">Narration</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                      {tx.entryGroupRef}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                      {tx.accountName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          tx.entryType === 'DEBIT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {tx.entryType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatPaise(tx.amountPaise)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">
                      {tx.narration}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
