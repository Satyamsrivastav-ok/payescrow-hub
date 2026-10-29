import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Plus,
  Scale,
  Calendar,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import { EscrowTransaction, SubMerchant } from '../types/index.js';

interface EscrowsProps {
  escrows: EscrowTransaction[];
  merchants: SubMerchant[];
  onOpenCreateEscrow: () => void;
  onOpenReleaseEscrow: (escrow: EscrowTransaction) => void;
  onOpenRefundEscrow: (escrow: EscrowTransaction) => void;
  onOpenDispute: (escrow: EscrowTransaction) => void;
}

export const Escrows: React.FC<EscrowsProps> = ({
  escrows,
  merchants,
  onOpenCreateEscrow,
  onOpenReleaseEscrow,
  onOpenRefundEscrow,
  onOpenDispute,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('ALL');

  const filteredEscrows = escrows.filter((e) => {
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchesMerchant =
      selectedMerchantId === 'ALL' || e.merchantId === selectedMerchantId;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      e.referenceCode.toLowerCase().includes(query) ||
      e.buyerName.toLowerCase().includes(query) ||
      e.buyerEmail.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query);
    return matchesStatus && matchesMerchant && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Escrow Transactions Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Custodial accounts, automatic fee retention, milestone verification, and multi-party releases.
          </p>
        </div>

        <button
          onClick={onOpenCreateEscrow}
          className="px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lock New Escrow</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
            {['ALL', 'FUNDED_HELD', 'RELEASED', 'DISPUTED', 'REFUNDED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Merchant Select */}
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sub-Merchants</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.businessName}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search reference, buyer, item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">ESCROW REF</th>
                <th className="py-3 px-4">SUB-MERCHANT</th>
                <th className="py-3 px-4">BUYER & CONTRACT</th>
                <th className="py-3 px-4">FINANCIAL BREAKDOWN</th>
                <th className="py-3 px-4">MILESTONE / HOLD</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">CUSTODIAL ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredEscrows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No escrow transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEscrows.map((escrow) => {
                  const merchant =
                    merchants.find((m) => m.id === escrow.merchantId) || escrow.merchant;
                  return (
                    <tr key={escrow.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Ref */}
                      <td className="py-3 px-4 text-indigo-300 font-semibold align-top">
                        {escrow.referenceCode}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {new Date(escrow.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Sub-merchant */}
                      <td className="py-3 px-4 text-slate-200 align-top font-sans">
                        <div className="font-medium text-slate-200">
                          {merchant?.businessName || escrow.merchantId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Fee: {merchant?.feePercentage ?? 2.5}% + $
                          {((merchant?.fixedFeeCents ?? 30) / 100).toFixed(2)}
                        </div>
                      </td>

                      {/* Buyer & Description */}
                      <td className="py-3 px-4 text-slate-300 align-top font-sans max-w-xs">
                        <div className="font-medium text-slate-200">{escrow.buyerName}</div>
                        <div className="text-slate-400 text-[11px] truncate">{escrow.description}</div>
                        <div className="text-slate-500 text-[10px]">{escrow.buyerEmail}</div>
                      </td>

                      {/* Financial Breakdown */}
                      <td className="py-3 px-4 align-top font-mono">
                        <div className="text-slate-200">
                          Gross: $
                          {(escrow.grossAmountCents / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-indigo-400 text-[10px]">
                          Fee: -$
                          {(escrow.platformFeeCents / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          Net: $
                          {(escrow.netMerchantCents / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </td>

                      {/* Milestone */}
                      <td className="py-3 px-4 align-top font-sans text-slate-300 max-w-xs">
                        <div className="text-[11px] font-medium text-slate-200">
                          {escrow.milestoneTitle || 'Standard Fulfillment'}
                        </div>
                        {escrow.deliveryTrackingNumber && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span>{escrow.deliveryTrackingNumber}</span>
                          </div>
                        )}
                        {escrow.holdUntil && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Hold: {new Date(escrow.holdUntil).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono ${
                            escrow.status === 'FUNDED_HELD'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : escrow.status === 'RELEASED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : escrow.status === 'DISPUTED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {escrow.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right font-sans space-x-1.5 whitespace-nowrap">
                        {escrow.status === 'FUNDED_HELD' && (
                          <>
                            <button
                              onClick={() => onOpenReleaseEscrow(escrow)}
                              className="px-2.5 py-1 text-[11px] rounded bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium transition-colors"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => onOpenRefundEscrow(escrow)}
                              className="px-2.5 py-1 text-[11px] rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                            >
                              Refund
                            </button>
                            <button
                              onClick={() => onOpenDispute(escrow)}
                              className="px-2.5 py-1 text-[11px] rounded bg-rose-600/80 hover:bg-rose-600 text-white font-medium transition-colors"
                            >
                              Dispute
                            </button>
                          </>
                        )}

                        {escrow.status === 'RELEASED' && (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Settled
                          </span>
                        )}

                        {escrow.status === 'DISPUTED' && (
                          <button
                            onClick={() => onOpenDispute(escrow)}
                            className="px-2.5 py-1 text-[11px] rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                          >
                            Arbitrate
                          </button>
                        )}

                        {escrow.status === 'REFUNDED' && (
                          <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Refunded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
