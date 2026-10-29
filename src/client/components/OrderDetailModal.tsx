import React from 'react';
import { X, ShoppingCart, ShieldCheck, ArrowUpRight, CheckCircle2, Building2, CreditCard } from 'lucide-react';
import { Order, Milestone } from '../types/fintech.js';
import { StatusBadge } from './StatusBadge.js';
import { formatPaise } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.js';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onApproveMilestone?: (milestone: Milestone, orderNumber: string) => void;
  onInitiatePayout?: (order: Order, merchantId?: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onApproveMilestone,
  onInitiatePayout,
}) => {
  const { isAdmin } = useAuth();
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{order.orderNumber}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Customer: {order.customerReference} · {order.customerEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative & High-Level Split Metrics */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <p className="text-xs text-slate-700 font-medium">{order.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cart Total</span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatPaise(order.totalAmountPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Platform Fee</span>
              <span className="text-sm font-bold font-mono text-indigo-700">
                {formatPaise(order.platformFeePaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Sub-Merchant Net</span>
              <span className="text-sm font-bold font-mono text-emerald-700">
                {formatPaise(order.totalAmountPaise - order.platformFeePaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Created</span>
              <span className="text-xs font-mono text-slate-600 block mt-0.5">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Allocations breakdown */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Sub-Merchant Allocations ({order.allocations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.allocations.map((alloc) => (
              <div
                key={alloc.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs text-xs space-y-2"
              >
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-slate-900 truncate">
                    {alloc.merchant?.businessName || 'Sub-Merchant'}
                  </span>
                  <span className="font-mono text-indigo-700 text-[11px]">
                    {alloc.merchant?.merchantCode}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Share ({alloc.splitValue}%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatPaise(alloc.grossAmountPaise)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Commission Retained:</span>
                  <span className="font-mono text-rose-600">
                    - {formatPaise(alloc.merchantFeePaise)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-slate-100 text-slate-900">
                  <span>Net Payable Escrow:</span>
                  <span className="font-mono text-emerald-700">
                    {formatPaise(alloc.netAmountPaise)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Disbursed:</span>
                  <span className="font-mono">{formatPaise(alloc.releasedAmountPaise)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverable Milestones */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Deliverable Escrow Milestones ({order.milestones.length})
          </h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Milestone Code</th>
                  <th className="py-2.5 px-3">Deliverable Title</th>
                  <th className="py-2.5 px-3 text-right">Unlock Amount (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {m.milestoneCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{m.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{m.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatPaise(m.amountPaise)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isAdmin && m.status === 'PENDING' && onApproveMilestone ? (
                        <button
                          onClick={() => {
                            onClose();
                            onApproveMilestone(m, order.orderNumber);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Banking Payouts */}
        {order.payouts && order.payouts.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dispatched Banking Transfers ({order.payouts.length})
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Payout Ref</th>
                    <th className="py-2.5 px-3">Rail</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Idempotency Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.payoutReference}</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">{p.payoutMethod}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatPaise(p.amountPaise)}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {p.idempotencyKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
