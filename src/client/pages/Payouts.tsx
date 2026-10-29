import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  Inbox,
  Building2,
  Lock,
} from 'lucide-react';
import { Payout, Merchant, Order } from '../types/fintech.js';
import { fetchPayouts, retryPayout } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { PayoutCreateModal } from '../components/PayoutCreateModal.js';
import { useAuth } from '../context/AuthContext.js';

interface PayoutsProps {
  merchants: Merchant[];
  orders: Order[];
  preselectedMerchantId?: string | null;
  preselectedOrder?: Order | null;
  onClearPreselections?: () => void;
}

export const Payouts: React.FC<PayoutsProps> = ({
  merchants,
  orders,
  preselectedMerchantId,
  preselectedOrder,
  onClearPreselections,
}) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Retry state
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Payout Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { isAdmin, isMerchant } = useAuth();

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  useEffect(() => {
    if (preselectedMerchantId || preselectedOrder) {
      setIsCreateModalOpen(true);
    }
  }, [preselectedMerchantId, preselectedOrder]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPayouts({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setPayouts(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payout records');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (payoutId: string) => {
    try {
      setRetryingId(payoutId);
      await retryPayout(payoutId);
      await loadPayouts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to retry payout');
    } finally {
      setRetryingId(null);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.payoutReference.toLowerCase().includes(search.toLowerCase()) ||
      p.idempotencyKey.toLowerCase().includes(search.toLowerCase()) ||
      (p.merchant?.businessName || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalProcessedPaise = payouts
    .filter((p) => p.status === 'PROCESSED')
    .reduce((sum, p) => sum + p.amountPaise, 0);

  const totalInTransitPaise = payouts
    .filter((p) => p.status === 'PENDING' || p.status === 'IN_TRANSIT')
    .reduce((sum, p) => sum + p.amountPaise, 0);

  const failedCount = payouts.filter((p) => p.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isMerchant ? 'My Bank Disbursals' : 'Banking Payout Pipeline & Disbursals'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated NEFT, RTGS, and IMPS clearing to sub-merchant beneficiary accounts with idempotency protection
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Payout</span>
          </button>
        )}
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Cleared to Beneficiary
          </span>
          <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">
            {formatPaise(totalProcessedPaise)}
          </span>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">
            {payouts.filter((p) => p.status === 'PROCESSED').length} processed
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            In Transit Pipeline
          </span>
          <span className="text-xl font-bold text-indigo-700 font-mono mt-1 block">
            {formatPaise(totalInTransitPaise)}
          </span>
          <span className="text-[11px] text-indigo-600 font-mono mt-0.5 block">
            ACH / NEFT batch queue
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Failed Reversals
          </span>
          <span className={`text-xl font-bold font-mono mt-1 block ${failedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {failedCount}
          </span>
          <span className="text-[11px] text-slate-500 block">Requires reconciliation</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Idempotency Guard
          </span>
          <span className="text-xs font-bold text-indigo-700 mt-2 block">
            SHA-256 Key Locked
          </span>
          <span className="text-[11px] text-slate-500 block">Zero duplicate transfers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by payout ref, merchant, or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Transfer State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="PROCESSED">PROCESSED (Cleared)</option>
            <option value="PENDING">PENDING (Queued)</option>
            <option value="IN_TRANSIT">IN TRANSIT (Bank Routing)</option>
            <option value="FAILED">FAILED (Rejected)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading banking payout transfers...</span>
          </div>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Payout Records</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {isMerchant
              ? 'No payouts have been dispatched to your bank account yet.'
              : 'No banking transfers match the current query.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate First Payout</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Payout Ref</th>
                  <th className="py-3 px-4">Beneficiary Sub-Merchant</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.payoutReference}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {p.merchant?.businessName || 'Sub-Merchant'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.merchant?.bankName} · •••• {p.merchant?.accountNumberLast4}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {p.order?.orderNumber || '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatPaise(p.amountPaise)}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-indigo-700">
                      {p.payoutMethod}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate" title={p.idempotencyKey}>
                      {p.idempotencyKey}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isAdmin && p.status === 'FAILED' ? (
                        <button
                          onClick={() => handleRetry(p.id)}
                          disabled={retryingId === p.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          {retryingId === p.id ? 'Retrying...' : 'Retry Clear'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Create Modal */}
      {isAdmin && (
        <PayoutCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            onClearPreselections?.();
          }}
          onSuccess={loadPayouts}
          merchants={merchants}
          orders={orders}
          preselectedOrder={preselectedOrder}
          preselectedMerchantId={preselectedMerchantId}
        />
      )}
    </div>
  );
};
