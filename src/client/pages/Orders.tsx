import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Inbox,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Order, Merchant, Milestone } from '../types/fintech.js';
import { fetchOrders } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { OrderDetailModal } from '../components/OrderDetailModal.js';
import { useAuth } from '../context/AuthContext.js';

interface OrdersProps {
  onOpenCreateOrder: () => void;
  onApproveMilestone?: (milestone: Milestone, orderNumber: string) => void;
  onInitiatePayout?: (order: Order, merchantId?: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({
  onOpenCreateOrder,
  onApproveMilestone,
  onInitiatePayout,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Expanded row state for quick split inspection
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal inspection
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  const { isAdmin, isMerchant } = useAuth();

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrders({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setOrders(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch marketplace orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const toggleExpand = (orderId: string) => {
    setExpandedRowId((prev) => (prev === orderId ? null : orderId));
  };

  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmountPaise, 0);
  const totalPlatformFees = orders.reduce((sum, o) => sum + o.platformFeePaise, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isMerchant ? 'My Split Orders' : 'Marketplace Orders & Split Escrow'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic multi-party split allocations, escrow lock status, and deliverable milestone unlock progress
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Split Order</span>
          </button>
        )}
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Orders Count
          </span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{orders.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Gross Cart Value
          </span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
            {formatPaise(totalVolume)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Platform Retained Fee
          </span>
          <span className="text-xl font-bold text-indigo-600 font-mono mt-1 block">
            {formatPaise(totalPlatformFees)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Fully Released
          </span>
          <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">
            {orders.filter((o) => o.status === 'RELEASED').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, customer ref, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Order State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="FUNDED">FUNDED (Escrow Locked)</option>
            <option value="PARTIALLY_RELEASED">PARTIALLY RELEASED</option>
            <option value="RELEASED">RELEASED (Fully Unlocked)</option>
            <option value="CREATED">CREATED (Pending Payment)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Querying marketplace orders and escrow splits...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {isMerchant
              ? 'No orders are currently allocated to your merchant account.'
              : 'No split orders match the query criteria or have been initialized in the system yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={onOpenCreateOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Split Order</span>
            </button>
          )}
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order # & Customer</th>
                  <th className="py-3 px-4">Escrow Status</th>
                  <th className="py-3 px-4 text-right">Cart Total</th>
                  <th className="py-3 px-4 text-right">Platform Fee</th>
                  <th className="py-3 px-4">Merchant Splits</th>
                  <th className="py-3 px-4">Milestone Release</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isExpanded = expandedRowId === order.id;
                  const approvedCount = order.milestones.filter(
                    (m) => m.status === 'APPROVED' || m.status === 'DISBURSED'
                  ).length;
                  const totalMilestones = order.milestones.length;
                  const pct = totalMilestones > 0 ? (approvedCount / totalMilestones) * 100 : 0;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Order Number & Customer */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {order.customerReference} · {order.customerEmail}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatPaise(order.totalAmountPaise)}
                        </td>

                        {/* Platform Fee */}
                        <td className="py-3 px-4 text-right font-mono text-indigo-700 font-semibold">
                          {formatPaise(order.platformFeePaise)}
                        </td>

                        {/* Splits */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{order.allocations.length} sub-merchants</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </td>

                        {/* Milestone Progress */}
                        <td className="py-3 px-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                              <span>
                                {approvedCount}/{totalMilestones} Unlocked
                              </span>
                              <span className="font-bold">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrderForDetail(order)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Inspect Order Splits & Payments"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (order.status === 'FUNDED' || order.status === 'PARTIALLY_RELEASED') && (
                              <button
                                onClick={() => onInitiatePayout?.(order)}
                                className="px-2 py-1 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                                title="Execute Escrow Payout"
                              >
                                Disburse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Merchant Splits Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="p-4 border-t border-b border-slate-200">
                            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                              Sub-Merchant Splits Breakdown
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {order.allocations.map((alloc) => (
                                <div
                                  key={alloc.id}
                                  className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-900 truncate">
                                      {alloc.merchant?.businessName || 'Sub-Merchant'}
                                    </span>
                                    <span className="text-indigo-600 font-mono text-[11px]">
                                      {alloc.merchant?.merchantCode}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-500">
                                    <span>Gross Share:</span>
                                    <span className="font-mono text-slate-800">
                                      {formatPaise(alloc.grossAmountPaise)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-500">
                                    <span>Commission Retained:</span>
                                    <span className="font-mono text-rose-600">
                                      - {formatPaise(alloc.merchantFeePaise)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                                    <span>Net Payable:</span>
                                    <span className="font-mono text-emerald-700">
                                      {formatPaise(alloc.netAmountPaise)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-slate-500">
                                    <span>Released to Date:</span>
                                    <span className="font-mono font-medium">
                                      {formatPaise(alloc.releasedAmountPaise)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          isOpen={!!selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          order={selectedOrderForDetail}
          onApproveMilestone={(milestone) => {
            if (onApproveMilestone) {
              onApproveMilestone(milestone, selectedOrderForDetail.orderNumber);
            }
          }}
          onInitiatePayout={onInitiatePayout}
        />
      )}
    </div>
  );
};
