import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { Merchant } from '../types/fintech.js';
import { createMerchant, updateMerchant } from '../services/api.js';
import { paiseToRupees, rupeesToPaise } from '../utils/currency.js';

interface MerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  merchantToEdit?: Merchant | null;
}

export const MerchantModal: React.FC<MerchantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  merchantToEdit,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumberLast4, setAccountNumberLast4] = useState('4412');
  const [ifscCode, setIfscCode] = useState('HDFC0001892');
  const [commissionPct, setCommissionPct] = useState('2.0');
  const [fixedFeeRupees, setFixedFeeRupees] = useState('25.00');
  const [status, setStatus] = useState<'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(merchantToEdit);

  useEffect(() => {
    if (merchantToEdit) {
      setBusinessName(merchantToEdit.businessName);
      setLegalName(merchantToEdit.legalName);
      setContactEmail(merchantToEdit.contactEmail);
      setContactPhone(merchantToEdit.contactPhone || '');
      setBankName(merchantToEdit.bankName);
      setAccountNumberLast4(merchantToEdit.accountNumberLast4);
      setIfscCode(merchantToEdit.ifscCode);
      setCommissionPct((merchantToEdit.defaultCommissionBps / 100).toFixed(2));
      setFixedFeeRupees(paiseToRupees(merchantToEdit.fixedFeePaise).toFixed(2));
      setStatus(merchantToEdit.status);
    } else {
      setBusinessName('');
      setLegalName('');
      setContactEmail('');
      setContactPhone('+91 98200 ');
      setBankName('HDFC Bank');
      setAccountNumberLast4(Math.floor(1000 + Math.random() * 9000).toString());
      setIfscCode('HDFC0002048');
      setCommissionPct('2.0');
      setFixedFeeRupees('25.00');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [merchantToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !contactEmail.trim() || !bankName.trim() || !ifscCode.trim()) {
      setError('Please fill in all mandatory business and banking fields.');
      return;
    }

    const defaultCommissionBps = Math.round(parseFloat(commissionPct) * 100);
    const fixedFeePaise = rupeesToPaise(fixedFeeRupees);

    try {
      setLoading(true);
      setError(null);

      if (isEditing && merchantToEdit) {
        await updateMerchant(merchantToEdit.id, {
          businessName: businessName.trim(),
          legalName: legalName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          status,
          bankName: bankName.trim(),
          accountNumberLast4: accountNumberLast4.trim(),
          ifscCode: ifscCode.trim(),
          defaultCommissionBps,
          fixedFeePaise,
        });
      } else {
        await createMerchant({
          businessName: businessName.trim(),
          legalName: legalName.trim() || businessName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          bankName: bankName.trim(),
          accountNumberLast4: accountNumberLast4.trim(),
          ifscCode: ifscCode.trim(),
          defaultCommissionBps,
          fixedFeePaise,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save merchant profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Sub-Merchant (${merchantToEdit?.merchantCode})` : 'Onboard Sub-Merchant'}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                KYC Verification · Custom Split Commission & IFSC Settlement Rails
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trading / Display Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="Apex Global Logistics"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Legal Entity Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="Apex Global Express Private Limited"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Finance Contact Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="settlements@partner.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Escalation Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="+91 98450 12890"
              />
            </div>
          </div>

          {/* Banking Verification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Beneficiary Bank Account & IFSC Clearing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  placeholder="HDFC Bank"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Account (Last 4 digits) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={accountNumberLast4}
                  onChange={(e) => setAccountNumberLast4(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
                  placeholder="8821"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  IFSC Branch Code *
                </label>
                <input
                  type="text"
                  required
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none uppercase"
                  placeholder="HDFC0001244"
                />
              </div>
            </div>
          </div>

          {/* Commission & Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Marketplace Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  required
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-full pr-6 pl-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-xs">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                BPS: {Math.round(parseFloat(commissionPct || '0') * 100)} basis points
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fixed Transaction Fee (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={fixedFeeRupees}
                  onChange={(e) => setFixedFeeRupees(e.target.value)}
                  className="w-full pl-6 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status (if editing) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                KYC Verification Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Fully Cleared)</option>
                <option value="UNDER_REVIEW">UNDER REVIEW (Docs Pending)</option>
                <option value="SUSPENDED">SUSPENDED (Frozen)</option>
              </select>
            </div>
          )}

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
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : isEditing ? 'Update Merchant' : 'Onboard Sub-Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
