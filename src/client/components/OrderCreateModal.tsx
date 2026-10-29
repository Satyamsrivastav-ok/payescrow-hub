import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Merchant } from '../types/fintech.js';
import { createOrder } from '../services/api.js';
import { formatPaise, rupeesToPaise } from '../utils/currency.js';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  merchants: Merchant[];
}

interface SplitRow {
  merchantId: string;
  percentage: number;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  merchants,
}) => {
  const activeMerchants = merchants.filter((m) => m.status === 'ACTIVE');

  const [customerReference, setCustomerReference] = useState('CUST-BLR-8921');
  const [customerEmail, setCustomerEmail] = useState('buyer.finance@enterprise-co.in');
  const [description, setDescription] = useState('Bulk Enterprise IT Hardware & Freight Deployment');
  const [orderAmountRupees, setOrderAmountRupees] = useState('100000'); // ₹1,00,000.00
  const [platformFeePct, setPlatformFeePct] = useState('2.0'); // 2%
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeMerchants.length >= 2 && splits.length === 0) {
      setSplits([
        { merchantId: activeMerchants[0].id, percentage: 60 },
        { merchantId: activeMerchants[1].id, percentage: 38 },
      ]);
    } else if (activeMerchants.length === 1 && splits.length === 0) {
      setSplits([{ merchantId: activeMerchants[0].id, percentage: 98 }]);
    }
  }, [activeMerchants, splits.length]);

  if (!isOpen) return null;

  const totalPaise = rupeesToPaise(orderAmountRupees);
  const platformFeeBps = Math.round(parseFloat(platformFeePct || '0') * 100);
  const platformFeePaise = Math.round((totalPaise * platformFeeBps) / 10000);

  // Calculate gross amounts per merchant in integer paise
  const calculatedAllocations = splits.map((split) => {
    const merchant = activeMerchants.find((m) => m.id === split.merchantId);
    const grossPaise = Math.round((totalPaise * (split.percentage * 100)) / 10000);
    const commissionBps = merchant?.defaultCommissionBps || 250;
    const feePaise = Math.round((grossPaise * commissionBps) / 10000);
    const netPaise = grossPaise - feePaise;

    return {
      merchantId: split.merchantId,
      splitType: 'PERCENTAGE' as const,
      splitValue: split.percentage,
      grossAmountPaise: grossPaise,
      merchantFeePaise: feePaise,
      netAmountPaise: netPaise,
      merchant,
    };
  });

  const sumGrossPaise = calculatedAllocations.reduce((sum, a) => sum + a.grossAmountPaise, 0);
  const sumPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
  const totalAllocatedPlusFee = sumGrossPaise + platformFeePaise;
  const isBalanced = totalAllocatedPlusFee === totalPaise && Math.abs(sumPercentage + parseFloat(platformFeePct || '0') - 100) < 0.01;
  const remainingPaiseToAllocate = totalPaise - totalAllocatedPlusFee;

  const handleAddSplit = () => {
    const unselected = activeMerchants.find(
      (m) => !splits.some((s) => s.merchantId === m.id)
    );
    if (!unselected) return;
    setSplits([...splits, { merchantId: unselected.id, percentage: 0 }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handlePercentageChange = (index: number, val: number) => {
    const copy = [...splits];
    copy[index].percentage = val;
    setSplits(copy);
  };

  const handleMerchantChange = (index: number, mId: string) => {
    const copy = [...splits];
    copy[index].merchantId = mId;
    setSplits(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isBalanced) {
      setError(
        `Allocation imbalance: Gross allocations + Platform Commission must equal ₹${(totalPaise / 100).toFixed(2)}. Difference: ₹${(remainingPaiseToAllocate / 100).toFixed(2)}.`
      );
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        customerReference,
        customerEmail,
        description,
        totalAmountPaise: totalPaise,
        platformFeePaise,
        allocations: calculatedAllocations,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create Marketplace Split Order
              </h2>
              <span className="text-xs text-slate-500">
                RBI Multi-Party Split Orchestration & Escrow Custody
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Reference #
              </label>
              <input
                type="text"
                required
                value={customerReference}
                onChange={(e) => setCustomerReference(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="CUST-2026-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Billing Email
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="billing@customer.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Order Narrative / Line Items Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. Enterprise Cloud Fleet Hardware + Logistics Delivery"
            />
          </div>

          {/* Pricing & Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gross Cart Value (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={orderAmountRupees}
                  onChange={(e) => setOrderAmountRupees(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Integer Paise: <strong className="font-mono text-slate-800">{totalPaise}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Platform Commission Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={platformFeePct}
                  onChange={(e) => setPlatformFeePct(e.target.value)}
                  className="w-full pr-7 pl-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-semibold mt-1 block">
                Platform Retains: <strong className="font-mono">{formatPaise(platformFeePaise)}</strong>
              </span>
            </div>
          </div>

          {/* Multi-Party Split Allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Sub-Merchant Split Allocations
              </span>
              <button
                type="button"
                onClick={handleAddSplit}
                disabled={splits.length >= activeMerchants.length}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Merchant Split</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {splits.map((split, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <select
                    value={split.merchantId}
                    onChange={(e) => handleMerchantChange(idx, e.target.value)}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    {activeMerchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.businessName} ({m.merchantCode})
                      </option>
                    ))}
                  </select>

                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      value={split.percentage}
                      onChange={(e) => handlePercentageChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full pr-5 pl-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <span className="absolute right-2 top-1 text-slate-400 font-bold text-xs">%</span>
                  </div>

                  <span className="w-28 text-right font-mono font-bold text-slate-800">
                    {formatPaise(calculatedAllocations[idx]?.grossAmountPaise || 0)}
                  </span>

                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Balance Validation Check */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 shrink-0" />
              <span>
                {isBalanced
                  ? 'Split Conserved: sum(splits) + platformFee === orderTotal'
                  : `Imbalance: ${remainingPaiseToAllocate > 0 ? 'Under-allocated by' : 'Over-allocated by'} ₹${Math.abs(remainingPaiseToAllocate / 100).toFixed(2)}`}
              </span>
            </div>
            <span className="font-mono font-bold">
              Total: {(sumPercentage + parseFloat(platformFeePct || '0')).toFixed(1)}%
            </span>
          </div>

          {/* Action Buttons */}
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
              disabled={loading || !isBalanced}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating & Funding Escrow...' : 'Deploy Order & Lock Escrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
