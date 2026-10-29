import React from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  Lock,
  DollarSign,
  TrendingUp,
  Scale,
  Building2,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  PlatformMetrics,
  EscrowTransaction,
  SubMerchant,
  AuditLog,
} from '../types/index.js';
import { Link } from 'react-router-dom';

interface DashboardProps {
  metrics: PlatformMetrics | null;
  escrows: EscrowTransaction[];
  merchants: SubMerchant[];
  auditLogs: AuditLog[];
  onOpenCreateEscrow: () => void;
  onOpenReleaseEscrow: (escrow: EscrowTransaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  escrows,
  merchants,
  auditLogs,
  onOpenCreateEscrow,
  onOpenReleaseEscrow,
}) => {
  // Chart Data Preparation
  const volumeChartData = [
    { period: 'May', gross: 42000, held: 18000, disbursed: 24000 },
    { period: 'Jun', gross: 68000, held: 22000, disbursed: 46000 },
    { period: 'Jul', gross: 95000, held: 35000, disbursed: 60000 },
    { period: 'Aug', gross: 124000, held: 42000, disbursed: 82000 },
    { period: 'Sep', gross: 156000, held: 58000, disbursed: 98000 },
    {
      period: 'Oct (Current)',
      gross: metrics ? Math.round(metrics.totalGrossEscrowVolumeCents / 100) : 185000,
      held: metrics ? Math.round(metrics.totalHeldInCustodyCents / 100) : 21700,
      disbursed: metrics ? Math.round(metrics.totalDisbursedToMerchantsCents / 100) : 57500,
    },
  ];

  const merchantBreakdownData = merchants.map((m) => ({
    name: m.businessName.length > 15 ? m.businessName.slice(0, 15) + '...' : m.businessName,
    held: m.totalEscrowHeldCents / 100,
    disbursed: m.totalDisbursedCents / 100,
  }));

  const activeEscrows = escrows.filter(
    (e) => e.status === 'FUNDED_HELD' || e.status === 'DISPUTED'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">
              Platform Settlement Engine
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">PostgreSQL + Prisma Source of Truth</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Sub-Merchant Payment Escrow Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Multi-party escrow custody, automated percentage & fixed fee withholding, buyer
            milestone release, and direct depository clearing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateEscrow}
            className="px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Lock New Escrow</span>
          </button>
          <Link
            to="/architecture"
            className="px-3.5 py-2 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Stack & Architecture
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In Custody */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total In Escrow Custody</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            $
            {metrics
              ? (metrics.totalHeldInCustodyCents / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">
              {metrics?.activeEscrowsCount || 0} active
            </span>
            <span>held pending fulfillment</span>
          </div>
        </div>

        {/* Card 2: Processed Volume */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total Gross Escrow Volume</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            $
            {metrics
              ? (metrics.totalGrossEscrowVolumeCents / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">Lifetime buyer contract clearing volume</div>
        </div>

        {/* Card 3: Disbursed to Merchants */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Released & Disbursed</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            $
            {metrics
              ? (metrics.totalDisbursedToMerchantsCents / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">Settled to verified sub-merchant bank accounts</div>
        </div>

        {/* Card 4: Platform Fee Retention */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Platform Fee Revenue</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight text-amber-300">
            $
            {metrics
              ? (metrics.totalPlatformFeesCollectedCents / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics?.activeDisputesCount || 0} active dispute arbitrations
          </div>
        </div>
      </div>

      {/* Visual Analytics with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume Trend */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Custodial Volume & Disbursement Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">
                Monthly progression of gross escrow deposits vs released payouts (USD)
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Recharts Area
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `$${val > 999 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: unknown) => [
                    `$${Number(val).toLocaleString()}`,
                    'USD',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Area
                  type="monotone"
                  dataKey="gross"
                  name="Gross Escrow Volume"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#grossGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  name="Disbursed to Merchants"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#disbursedGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Merchant Custody Distribution */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Sub-Merchant Custodial Balance vs Disbursed
              </h3>
              <p className="text-[11px] text-slate-400">
                Currently locked escrow balances compared against total lifetime settlements
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Recharts Bar
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={merchantBreakdownData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `$${val > 999 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'USD']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar
                  dataKey="held"
                  name="Held in Escrow"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="disbursed"
                  name="Disbursed Lifetime"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Active Escrows Needing Attention & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Escrows List (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Active Escrows Awaiting Release or Verification
              </h3>
            </div>
            <Link
              to="/escrows"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <span>View All Escrows ({escrows.length})</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="pb-2">REFERENCE</th>
                  <th className="pb-2">BUYER & SUBJECT</th>
                  <th className="pb-2">GROSS DEPOSIT</th>
                  <th className="pb-2">NET MERCHANT</th>
                  <th className="pb-2">STATUS</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {activeEscrows.slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-indigo-300 font-medium">{e.referenceCode}</td>
                    <td className="py-2.5 text-slate-300 font-sans">
                      <div className="font-medium text-slate-200">{e.buyerName}</div>
                      <div className="text-slate-500 text-[10px] truncate max-w-xs">
                        {e.description}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      ${(e.grossAmountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-emerald-400 font-semibold">
                      ${(e.netMerchantCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          e.status === 'FUNDED_HELD'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      {e.status === 'FUNDED_HELD' ? (
                        <button
                          onClick={() => onOpenReleaseEscrow(e)}
                          className="px-2.5 py-1 text-[11px] rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium transition-colors"
                        >
                          Release Funds
                        </button>
                      ) : (
                        <Link
                          to="/disputes"
                          className="px-2.5 py-1 text-[11px] rounded bg-amber-600/80 hover:bg-amber-600 text-white font-medium transition-colors inline-block"
                        >
                          Arbitrate
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Audit Log Stream (1 col) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Escrow Audit Log</h3>
            <span className="text-[10px] font-mono text-slate-400">IMMUTABLE</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {auditLogs.slice(0, 7).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 text-xs space-y-1 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-slate-500 text-[9px]">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                  {log.details}
                </div>
                <div className="text-[10px] text-slate-500">Actor: {log.performedBy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
