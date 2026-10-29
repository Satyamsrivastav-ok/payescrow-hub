import React from 'react';
import {
  ArrowUpRight,
  Landmark,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { DisbursementBatch, SubMerchant } from '../types/index.js';

interface DisbursementsProps {
  batches: DisbursementBatch[];
  merchants: SubMerchant[];
  onOpenCreateBatch: () => void;
}

export const Disbursements: React.FC<DisbursementsProps> = ({
  batches,
  merchants,
  onOpenCreateBatch,
}) => {
  const totalSettledCents = batches
    .filter((b) => b.status === 'SETTLED')
    .reduce((sum, b) => sum + b.totalAmountCents, 0);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Bank Disbursement & Clearing Batches
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated clearing house (ACH), Fedwire, and RTP settlement batches routed to verified sub-merchants.
          </p>
        </div>

        <button
          onClick={onOpenCreateBatch}
          className="px-3.5 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Dispatch Payout Batch</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
          <span className="text-[11px] text-slate-400 font-sans block">TOTAL SETTLED PAYOUTS</span>
          <div className="text-2xl font-bold text-emerald-400">
            ${(totalSettledCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-sans">
            Cleared to depository institutions
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
          <span className="text-[11px] text-slate-400 font-sans block">BATCHES DISPATCHED</span>
          <div className="text-2xl font-bold text-slate-100">{batches.length}</div>
          <span className="text-[10px] text-slate-500 font-sans">Lifetime automated clearing</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
          <span className="text-[11px] text-slate-400 font-sans block">SUPPORTED NETWORKS</span>
          <div className="text-sm font-bold text-indigo-300 font-sans pt-1">
            ACH · Fedwire · RTP
          </div>
          <span className="text-[10px] text-slate-500 font-sans">Zero direct API leakage</span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">BATCH REFERENCE</th>
                <th className="py-3 px-4">BENEFICIARY MERCHANT</th>
                <th className="py-3 px-4">PAYOUT METHOD</th>
                <th className="py-3 px-4">DISBURSED AMOUNT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">SETTLED AT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No disbursement batches generated yet.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const merchant =
                    merchants.find((m) => m.id === batch.merchantId) || batch.merchant;
                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-indigo-300 font-semibold font-mono">
                        {batch.batchReference}
                      </td>

                      <td className="py-3 px-4 text-slate-200 font-sans">
                        <div className="font-medium text-slate-200">
                          {merchant?.businessName || batch.merchantId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Bank: {merchant?.payoutBank} (••{merchant?.accountNumberLast4})
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {batch.payoutMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-emerald-400 font-bold font-mono">
                        $
                        {(batch.totalAmountCents / 100).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            batch.status === 'SETTLED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400">
                        {batch.settledAt
                          ? new Date(batch.settledAt).toLocaleString()
                          : 'Pending Processing'}
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
