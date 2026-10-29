import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Inbox,
  UserCheck,
} from 'lucide-react';
import { Milestone, Order } from '../types/fintech.js';
import { fetchOrders } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { MilestoneApproveModal } from '../components/MilestoneApproveModal.js';
import { useAuth } from '../context/AuthContext.js';

interface EscrowMilestonesProps {
  onInitiatePayout?: (order: Order, merchantId?: string) => void;
}

export const EscrowMilestones: React.FC<EscrowMilestonesProps> = ({ onInitiatePayout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected Milestone for Approval Modal
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('');

  const { isAdmin, isMerchant } = useAuth();

  useEffect(() => {
    loadOrdersWithMilestones();
  }, []);

  const loadOrdersWithMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrders();
      setOrders(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch milestone escrow records');
    } finally {
      setLoading(false);
    }
  };

  // Flatten milestones across orders
  const allMilestonesWithOrder = orders.flatMap((order) =>
    order.milestones.map((milestone) => ({
      ...milestone,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      orderCustomer: order.customerReference,
      parentOrder: order,
    }))
  );

  const filteredMilestones = allMilestonesWithOrder.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      m.milestoneCode.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = allMilestonesWithOrder.filter((m) => m.status === 'PENDING').length;
  const approvedCount = allMilestonesWithOrder.filter(
    (m) => m.status === 'APPROVED' || m.status === 'DISBURSED'
  ).length;
  const totalLockedPaise = allMilestonesWithOrder
    .filter((m) => m.status === 'PENDING')
    .reduce((sum, m) => sum + m.amountPaise, 0);
  const totalUnlockedPaise = allMilestonesWithOrder
    .filter((m) => m.status === 'APPROVED' || m.status === 'DISBURSED')
    .reduce((sum, m) => sum + m.amountPaise, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Escrow Deliverables & Milestone Releases
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Conditional fund locks released upon compliance verification and buyer deliverable confirmation
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Pending Approval
          </span>
          <span className="text-xl font-bold text-amber-700 mt-1 block">{pendingCount}</span>
          <span className="text-[11px] text-amber-600 font-mono mt-0.5 block">
            {formatPaise(totalLockedPaise)} locked
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Approved & Eligible
          </span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">{approvedCount}</span>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">
            {formatPaise(totalUnlockedPaise)} unlocked
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Total Milestones
          </span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {allMilestonesWithOrder.length}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Compliance Policy
          </span>
          <span className="text-xs font-bold text-indigo-700 mt-2 block">
            RBI Safe Custody
          </span>
          <span className="text-[11px] text-slate-500 block">No float pre-release</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by milestone code, order #, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Milestone State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="PENDING">PENDING (Funds Locked)</option>
            <option value="APPROVED">APPROVED (Ready for Bank Payout)</option>
            <option value="DISBURSED">DISBURSED (Paid Out)</option>
            <option value="REJECTED">REJECTED</option>
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
            <span>Loading milestone deliverables...</span>
          </div>
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Milestones Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {isMerchant
              ? 'No escrow milestones are associated with your orders.'
              : 'No milestones match the selected status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Milestone Code</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Deliverable Condition</th>
                  <th className="py-3 px-4 text-right">Unlock Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification Audit</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMilestones.map((m) => {
                  const canApprove =
                    isAdmin &&
                    m.status === 'PENDING' &&
                    (m.orderStatus === 'FUNDED' || m.orderStatus === 'PARTIALLY_RELEASED');

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Milestone Code */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {m.milestoneCode}
                      </td>

                      {/* Parent Order */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900">{m.orderNumber}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.orderCustomer}</div>
                      </td>

                      {/* Deliverable Title & Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{m.description}</div>
                      </td>

                      {/* Unlock Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatPaise(m.amountPaise)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={m.status} />
                      </td>

                      {/* Approval Info */}
                      <td className="py-3 px-4 text-slate-600">
                        {m.approvedAt ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="font-semibold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{m.approvedBy || 'Compliance Officer'}</span>
                            </div>
                            <div className="text-slate-500 font-mono text-[10px]">
                              {new Date(m.approvedAt).toLocaleDateString()} · {m.approvalReason}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 text-[11px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Awaiting Inspection</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        {canApprove ? (
                          <button
                            onClick={() => {
                              setSelectedMilestone(m);
                              setSelectedOrderNumber(m.orderNumber);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            Approve & Unlock
                          </button>
                        ) : m.status === 'APPROVED' && isAdmin ? (
                          <button
                            onClick={() => onInitiatePayout?.(m.parentOrder)}
                            className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Disburse
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Milestone Modal */}
      {selectedMilestone && (
        <MilestoneApproveModal
          isOpen={!!selectedMilestone}
          onClose={() => {
            setSelectedMilestone(null);
            setSelectedOrderNumber('');
          }}
          onSuccess={loadOrdersWithMilestones}
          milestone={selectedMilestone}
          orderNumber={selectedOrderNumber}
        />
      )}
    </div>
  );
};
