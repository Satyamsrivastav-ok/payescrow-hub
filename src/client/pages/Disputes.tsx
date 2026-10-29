import React from 'react';
import {
  Scale,
  AlertOctagon,
  CheckCircle2,
  FileText,
  DollarSign,
  Gavel,
  ShieldAlert,
} from 'lucide-react';
import { Dispute, EscrowTransaction } from '../types/index.js';

interface DisputesProps {
  disputes: Dispute[];
  escrows: EscrowTransaction[];
  onOpenArbitrate: (dispute: Dispute) => void;
}

export const Disputes: React.FC<DisputesProps> = ({
  disputes,
  escrows,
  onOpenArbitrate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          Escrow Dispute Arbitration
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Custodial fund freezes, inspection claim logs, evidence submission, and binding platform legal settlement.
        </p>
      </div>

      {/* Disputes Grid */}
      <div className="grid grid-cols-1 gap-4">
        {disputes.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-800 bg-slate-900 text-center text-slate-500 text-xs">
            No active disputes currently registered in the platform.
          </div>
        ) : (
          disputes.map((dispute) => {
            const escrow =
              escrows.find((e) => e.id === dispute.escrowId) || dispute.escrow;
            const isResolved = dispute.status.startsWith('RESOLVED');

            return (
              <div
                key={dispute.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {dispute.id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-indigo-300 font-mono">
                          Escrow: {escrow?.referenceCode || dispute.escrowId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-sans">
                        Raised on {new Date(dispute.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded font-mono font-medium ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {dispute.status}
                    </span>

                    {!isResolved && (
                      <button
                        onClick={() => onOpenArbitrate(dispute)}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Arbitrate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  {/* Left: Reason and Buyer Claim */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <span className="text-slate-400 font-medium block mb-0.5">
                        Dispute Assertion / Reason:
                      </span>
                      <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                        {dispute.reason}
                      </p>
                    </div>

                    {dispute.buyerClaimNotes && (
                      <div>
                        <span className="text-slate-400 font-medium block mb-0.5">
                          Buyer Claim Details:
                        </span>
                        <p className="text-slate-300 text-[11px] bg-slate-950/70 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                          {dispute.buyerClaimNotes}
                        </p>
                      </div>
                    )}

                    {dispute.evidenceText && (
                      <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono bg-indigo-500/10 px-3 py-1.5 rounded border border-indigo-500/20">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span>EVIDENCE REF: {dispute.evidenceText}</span>
                      </div>
                    )}

                    {dispute.arbitrationNotes && (
                      <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">
                        <span className="font-semibold block font-mono text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
                          Platform Arbitrator Decision Findings
                        </span>
                        {dispute.arbitrationNotes}
                      </div>
                    )}
                  </div>

                  {/* Right: Escrow Snapshot */}
                  <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2.5 font-mono text-[11px]">
                    <div className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1">
                      Locked Escrow Snapshot
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DISPUTED SUM:</span>
                      <span className="text-amber-400 font-bold">
                        ${(dispute.disputedAmountCents / 100).toFixed(2)}
                      </span>
                    </div>
                    {escrow && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">BUYER:</span>
                          <span className="text-slate-300">{escrow.buyerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">MERCHANT ID:</span>
                          <span className="text-slate-300 truncate max-w-[120px]">
                            {escrow.merchantId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ESCROW STATUS:</span>
                          <span className="text-rose-400">{escrow.status}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
