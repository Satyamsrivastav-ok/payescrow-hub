import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  ArrowUpRight,
  Edit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  History,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { Merchant } from '../types/fintech.js';
import { fetchMerchants, fetchMerchantById } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { MerchantModal } from '../components/MerchantModal.js';
import { useAuth } from '../context/AuthContext.js';

interface MerchantsProps {
  onInitiatePayout?: (merchantId: string) => void;
}

export const Merchants: React.FC<MerchantsProps> = ({ onInitiatePayout }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const { isAdmin } = useAuth();

  useEffect(() => {
    loadMerchants();
  }, [statusFilter]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchants({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setMerchants(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sub-merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMerchants();
  };

  const openDrawer = async (m: Merchant) => {
    try {
      const detailed = await fetchMerchantById(m.id);
      setSelectedMerchant(detailed);
    } catch {
      setSelectedMerchant(m);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sub-Merchant Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified marketplace vendor entities, custom commission agreements, and IFSC-routed payout accounts
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingMerchant(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Sub-Merchant</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by legal name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">KYC Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE (Cleared)</option>
            <option value="UNDER_REVIEW">UNDER REVIEW (Docs Pending)</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading verified sub-merchants...</span>
          </div>
        </div>
      ) : merchants.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Sub-Merchants Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            No marketplace vendors match the current query or status filter.
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingMerchant(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard First Sub-Merchant</span>
            </button>
          )}
        </div>
      ) : (
        /* Merchants Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Merchant Entity</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Bank & Routing</th>
                  <th className="py-3 px-4 text-right">Commission Rate</th>
                  <th className="py-3 px-4 text-right">Escrow Held (₹)</th>
                  <th className="py-3 px-4 text-right">Disbursed (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Merchant Info */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{merchant.businessName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-indigo-600 font-bold">{merchant.merchantCode}</span>
                        <span>·</span>
                        <span>{merchant.contactEmail}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={merchant.status} />
                    </td>

                    {/* Banking */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{merchant.bankName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        •••• {merchant.accountNumberLast4} | <span className="font-semibold text-slate-700">{merchant.ifscCode}</span>
                      </div>
                    </td>

                    {/* Commission */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="font-bold text-slate-800">
                        {(merchant.defaultCommissionBps / 100).toFixed(2)}%
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        + {formatPaise(merchant.fixedFeePaise)} fixed
                      </span>
                    </td>

                    {/* Escrow Held */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {formatPaise(merchant.totalEscrowHeldPaise)}
                    </td>

                    {/* Disbursed */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatPaise(merchant.totalDisbursedPaise)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDrawer(merchant)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Merchant Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setEditingMerchant(merchant);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Merchant Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && merchant.status === 'ACTIVE' && onInitiatePayout && (
                          <button
                            onClick={() => onInitiatePayout(merchant.id)}
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                            title="Initiate Bank Disbursal"
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side Drawer for Merchant Inspection */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 overflow-y-auto space-y-6 shadow-2xl relative animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedMerchant.businessName}
                  </h2>
                  <span className="text-xs font-mono font-semibold text-indigo-600">
                    {selectedMerchant.merchantCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account Status:</span>
                <StatusBadge status={selectedMerchant.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Legal Name:</span>
                <span className="text-slate-900 font-semibold">{selectedMerchant.legalName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Contact Email:</span>
                <span className="text-slate-900 font-mono">{selectedMerchant.contactEmail}</span>
              </div>
              {selectedMerchant.contactPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="text-slate-900 font-mono">{selectedMerchant.contactPhone}</span>
                </div>
              )}
            </div>

            {/* Banking Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Verified Banking Channel</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Bank Name:</span>
                <span className="text-slate-900 font-medium">{selectedMerchant.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account (Last 4):</span>
                <span className="text-slate-900 font-mono">
                  •••• •••• •••• {selectedMerchant.accountNumberLast4}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">IFSC Routing Code:</span>
                <span className="text-indigo-700 font-mono font-bold">
                  {selectedMerchant.ifscCode}
                </span>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-semibold block mb-0.5">
                  Escrow Held
                </span>
                <span className="text-base font-bold text-amber-900 font-mono">
                  {formatPaise(selectedMerchant.totalEscrowHeldPaise)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block mb-0.5">
                  Disbursed To Date
                </span>
                <span className="text-base font-bold text-emerald-900 font-mono">
                  {formatPaise(selectedMerchant.totalDisbursedPaise)}
                </span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingMerchant(selectedMerchant);
                    setSelectedMerchant(null);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
              {isAdmin && selectedMerchant.status === 'ACTIVE' && onInitiatePayout && (
                <button
                  onClick={() => {
                    const mId = selectedMerchant.id;
                    setSelectedMerchant(null);
                    onInitiatePayout(mId);
                  }}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Initiate Payout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboard / Edit Sub-Merchant Modal */}
      <MerchantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMerchant(null);
        }}
        onSuccess={loadMerchants}
        merchantToEdit={editingMerchant}
      />
    </div>
  );
};
