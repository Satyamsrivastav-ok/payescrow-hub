import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Milestone } from '../types/fintech.js';
import { approveMilestone } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.js';

interface MilestoneApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  milestone: Milestone | null;
  orderNumber?: string;
}

export const MilestoneApproveModal: React.FC<MilestoneApproveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  milestone,
  orderNumber,
}) => {
  const { user } = useAuth();
  const [approvalReason, setApprovalReason] = useState(
    'Deliverable verified against contractual SLA criteria. Approved for sub-merchant disbursement.'
  );
  const [confirmedDelivery, setConfirmedDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !milestone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedDelivery) {
      setError('You must confirm that deliverable requirements have been verified.');
      return;
    }
    if (!approvalReason.trim()) {
      setError('Approval audit justification is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await approveMilestone(milestone.orderId, milestone.id, {
        approvalReason: approvalReason.trim(),
        approvedBy: user ? `${user.name} (${user.email})` : 'admin@escrowhub.internal',
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Authorize Milestone Release
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Order Ref: {orderNumber || milestone.orderId}
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

        {/* Milestone Summary Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Milestone Code:</span>
            <span className="font-mono font-bold text-indigo-700">{milestone.milestoneCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Deliverable Title:</span>
            <span className="font-semibold text-slate-900">{milestone.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Description:</span>
            <span className="text-slate-700 truncate max-w-xs">{milestone.description}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-700 font-bold uppercase text-[11px]">
              Escrow Funds Unlocked:
            </span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {formatPaise(milestone.amountPaise)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Approving Compliance Officer
            </label>
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 font-semibold">
              {user ? `${user.name} (${user.email})` : 'admin@escrowhub.internal'}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Identity authenticated via cryptographic bearer session
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Approval Justification & Audit Narrative
            </label>
            <textarea
              required
              rows={3}
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
              placeholder="State verification audit evidence..."
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <input
              type="checkbox"
              id="confirmMilestone"
              checked={confirmedDelivery}
              onChange={(e) => setConfirmedDelivery(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="confirmMilestone" className="text-xs text-emerald-950 font-medium cursor-pointer">
              I formally certify that the deliverable milestone criteria have been fulfilled and agree to release {formatPaise(milestone.amountPaise)} from safe custody into the sub-merchant disbursement ledger.
            </label>
          </div>

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
              disabled={loading || !confirmedDelivery}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authorizing Release...' : 'Confirm Milestone Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
