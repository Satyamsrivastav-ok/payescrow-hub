import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Code,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  Clock,
  Inbox,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { AuditEvent } from '../types/fintech.js';
import { fetchAuditLogs } from '../services/api.js';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Expanded JSON metadata row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAuditLogs({
        entityType: entityFilter === 'ALL' ? undefined : entityFilter,
        search: search.trim() || undefined,
      });
      setLogs(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const toggleExpand = (logId: string) => {
    setExpandedRowId((prev) => (prev === logId ? null : logId));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Security & Operational Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable append-only record of all financial lifecycle mutations with session-derived actor provenance
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, details, actor, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Entity Scope:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            <option value="ORDER">ORDER</option>
            <option value="MILESTONE">MILESTONE</option>
            <option value="PAYOUT">PAYOUT</option>
            <option value="MERCHANT">MERCHANT</option>
            <option value="USER">USER</option>
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
            <span>Loading audit events...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Audit Events Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            System operations, logins, orders, milestone approvals, and bank payouts will appear in this append-only stream.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Verified Actor</th>
                  <th className="py-3 px-4">Details & Event Narrative</th>
                  <th className="py-3 px-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isExpanded = expandedRowId === log.id;
                  let parsedMetadata: any = null;
                  if (log.metadata) {
                    try {
                      parsedMetadata = JSON.parse(log.metadata);
                    } catch {
                      parsedMetadata = log.metadata;
                    }
                  }

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            {log.entityType}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {log.action}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-indigo-700 font-semibold">
                          {log.actor}
                        </td>

                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          {log.details}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {parsedMetadata ? (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Code className="w-3 h-3 text-slate-500" />
                              <span>JSON</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && parsedMetadata && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4 border-t border-b border-slate-200">
                            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto">
                              {JSON.stringify(parsedMetadata, null, 2)}
                            </pre>
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
    </div>
  );
};
