import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  Inbox,
  Scale,
} from 'lucide-react';
import { LedgerEntry } from '../types/fintech.js';
import { fetchTransactions } from '../services/api.js';
import { formatPaise } from '../utils/currency.js';

interface GroupBalance {
  entryGroupRef: string;
  debitsPaise: number;
  creditsPaise: number;
  isBalanced: boolean;
  entryCount: number;
}

export const Transactions: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedGroupRef, setSelectedGroupRef] = useState<string | null>(null);

  useEffect(() => {
    loadLedger();
  }, [accountFilter]);

  const loadLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTransactions(accountFilter === 'ALL' ? undefined : accountFilter);
      setEntries(res.entries);
      setGroupBalances(res.groupBalances);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query ledger transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const matchesGroup = !selectedGroupRef || e.entryGroupRef === selectedGroupRef;
    const matchesSearch =
      search.trim() === '' ||
      e.entryGroupRef.toLowerCase().includes(search.toLowerCase()) ||
      e.accountName.toLowerCase().includes(search.toLowerCase()) ||
      e.narration.toLowerCase().includes(search.toLowerCase()) ||
      (e.order?.orderNumber || '').toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + e.amountPaise, 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + e.amountPaise, 0);

  const allBalanced = groupBalances.every((g) => g.isBalanced);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Double-Entry Ledger & Transaction Journal
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable financial records guaranteeing mathematical debit/credit conservation with zero floating-point drift
        </p>
      </div>

      {/* Accounting Integrity Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
              Ledger Health
            </span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">
                {allBalanced ? '100% Balanced' : 'Unbalanced Detected'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {groupBalances.length} balancing transaction groups verified
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Cumulative Debits
          </span>
          <span className="text-xl font-bold text-rose-700 font-mono mt-1 block">
            {formatPaise(totalDebits)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            {entries.filter((e) => e.entryType === 'DEBIT').length} debit journal postings
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Cumulative Credits
          </span>
          <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">
            {formatPaise(totalCredits)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            {entries.filter((e) => e.entryType === 'CREDIT').length} credit journal postings
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by journal ref, account, order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedGroupRef && (
            <button
              onClick={() => setSelectedGroupRef(null)}
              className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-medium cursor-pointer"
            >
              Clear Group Filter ({selectedGroupRef})
            </button>
          )}

          <span className="text-xs font-semibold text-slate-500">Ledger Account:</span>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All Ledger Accounts</option>
            <option value="ESCROW_CUSTODIAL_WALLET">ESCROW_CUSTODIAL_WALLET</option>
            <option value="SUB_MERCHANT_PAYABLE">SUB_MERCHANT_PAYABLE</option>
            <option value="PLATFORM_COMMISSION">PLATFORM_COMMISSION</option>
            <option value="CUSTOMER_CLEARING">CUSTOMER_CLEARING</option>
            <option value="BANK_DISBURSEMENT_CLEARING">BANK_DISBURSEMENT_CLEARING</option>
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
            <span>Loading PostgreSQL ledger entries...</span>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Ledger Transactions Posted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When split orders are funded or payouts are cleared, balanced debit and credit entries will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Group Ref</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Leg</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Related Order</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => setSelectedGroupRef(e.entryGroupRef)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        title="Filter entire balanced transaction group"
                      >
                        {e.entryGroupRef}
                      </button>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      {e.accountName}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          e.entryType === 'DEBIT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {e.entryType}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatPaise(e.amountPaise)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {e.order?.orderNumber || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={e.narration}>
                      {e.narration}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(e.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
