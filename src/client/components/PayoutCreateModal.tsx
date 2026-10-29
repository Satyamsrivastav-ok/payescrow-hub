import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle, CheckCircle2, RefreshCw, Building2, CreditCard } from 'lucide-react';
import { Merchant, Order } from '../types/fintech.js';
import { createPayout } from '../services/api.js';
import { formatPaise, rupeesToPaise } from '../utils/currency.js';

interface PayoutCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  merchants: Merchant[];
  orders: Order[];
  preselectedOrder?: Order | null;
  preselectedMerchantId?: string | null;
}

export const PayoutCreateModal: React.FC<PayoutCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  merchants,
  orders,
  preselectedOrder,
  preselectedMerchantId,
}) => {
  const eligibleOrders = orders.filter(
    (o) => o.status === 'FUNDED' || o.status === 'PARTIALLY_RELEASED' || o.status === 'RELEASED'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [amountRupees, setAmountRupees] = useState<string>('25000');
  const [payoutMethod, setPayoutMethod] = useState<'NEFT' | 'RTGS' | 'IMPS' | 'UPI'>('NEFT');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdempotencyKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 10);
    return `idemp_payout_${Date.now()}_${randomHex}`;
  };

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      if (preselectedOrder) {
        setSelectedOrderId(preselectedOrder.id);
      } else if (eligibleOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligibleOrders[0].id);
      }
    }
  }, [isOpen, preselectedOrder]);

  const activeOrder = orders.find((o) => o.id === selectedOrderId);
  const orderAllocations = activeOrder?.allocations || [];

  useEffect(() => {
    if (preselectedMerchantId) {
      setSelectedMerchantId(preselectedMerchantId);
    } else if (orderAllocations.length > 0 && !selectedMerchantId) {
      setSelectedMerchantId(orderAllocations[0].merchantId);
    }
  }, [orderAllocations, preselectedMerchantId]);

  const currentAllocation = orderAllocations.find((a) => a.merchantId === selectedMerchantId);
  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  const remainingPaiseEligible = currentAllocation
    ? currentAllocation.netAmountPaise - currentAllocation.releasedAmountPaise
    : 0;

  useEffect(() => {
    if (remainingPaiseEligible > 0) {
      setAmountRupees((remainingPaiseEligible / 100).toFixed(2));
    }
  }, [remainingPaiseEligible]);

  if (!isOpen) return null;

  const enteredPaise = rupeesToPaise(amountRupees);
  const isOverDisbursing = enteredPaise > remainingPaiseEligible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedMerchantId) {
      setError('Please select both a funded source order and beneficiary merchant.');
      return;
    }
    if (enteredPaise <= 0) {
      setError('Payout amount must be greater than zero.');
      return;
    }
    if (isOverDisbursing) {
      setError(
        `Disbursement ceiling violated: Payout (₹${(enteredPaise / 100).toFixed(2)}) exceeds remaining eligible balance (${formatPaise(remainingPaiseEligible)}).`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createPayout(selectedOrderId, {
        merchantId: selectedMerchantId,
        allocationId: currentAllocation?.id,
        amountPaise: enteredPaise,
        payoutMethod,
        idempotencyKey,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute payout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Initiate Sub-Merchant Payout
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Idempotent Banking Settlement · RTGS / NEFT Rails
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Select Source Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Source Marketplace Order (Funded in Escrow)
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {eligibleOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — Total Cart: {formatPaise(o.totalAmountPaise)} ({o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Select Sub-Merchant */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Beneficiary Sub-Merchant Allocation
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {orderAllocations.map((alloc) => (
                <option key={alloc.merchantId} value={alloc.merchantId}>
                  {alloc.merchant?.businessName || 'Sub-Merchant'} — Net Allocation: {formatPaise(alloc.netAmountPaise)}
                </option>
              ))}
            </select>
          </div>

          {/* Beneficiary Bank Account Preview */}
          {selectedMerchant && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Verified Beneficiary Bank Routing</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bank Name:</span>
                <span className="font-semibold text-slate-800">{selectedMerchant.bankName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Account Number:</span>
                <span className="font-mono font-semibold text-slate-800">•••• {selectedMerchant.accountNumberLast4}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IFSC Code:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedMerchant.ifscCode}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-800 font-bold">
                <span>Remaining Eligible Ceiling:</span>
                <span className="font-mono text-emerald-700">{formatPaise(remainingPaiseEligible)}</span>
              </div>
            </div>
          )}

          {/* Transfer Amount and Rails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payout Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-lg border bg-white focus:outline-none ${
                    isOverDisbursing ? 'border-rose-400 text-rose-700' : 'border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>
              {isOverDisbursing && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  Amount exceeds remaining allocation
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Settlement Rail
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value as any)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="NEFT">NEFT (RBI Batch Clearing)</option>
                <option value="RTGS">RTGS (High-Value Immediate)</option>
                <option value="IMPS">IMPS (Instant 24x7)</option>
                <option value="UPI">UPI 2.0 AutoSplit</option>
              </select>
            </div>
          </div>

          {/* Idempotency Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Idempotency Unique Key
              </label>
              <button
                type="button"
                onClick={() => setIdempotencyKey(generateIdempotencyKey())}
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={idempotencyKey}
              className="w-full text-xs font-mono p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Guarantees zero duplicate bank executions on network retries
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverDisbursing}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Routing Banking Rails...' : 'Confirm & Dispatch Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
