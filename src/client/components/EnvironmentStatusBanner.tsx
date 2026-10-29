import React from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, Terminal, ArrowRight } from 'lucide-react';
import { SystemHealth } from '../types/index.js';
import { Link } from 'react-router-dom';

interface EnvironmentStatusBannerProps {
  health: SystemHealth | null;
}

export const EnvironmentStatusBanner: React.FC<EnvironmentStatusBannerProps> = ({ health }) => {
  const isPostgresConnected = health?.database.connected ?? false;

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/50 px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Architecture Stack:</span>
          </div>

          <span className="text-slate-400">
            Node.js + Express.js <span className="text-slate-600">·</span> TypeScript{' '}
            <span className="text-slate-600">·</span> Zod <span className="text-slate-600">·</span>{' '}
            Prisma ORM <span className="text-slate-600">·</span> PostgreSQL 16
          </span>

          <span className="hidden xl:inline text-slate-600">|</span>

          <span className="hidden xl:inline text-slate-400">
            React 19 <span className="text-slate-600">·</span> React Router{' '}
            <span className="text-slate-600">·</span> Recharts{' '}
            <span className="text-slate-600">·</span> Jest + Supertest
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {isPostgresConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PostgreSQL Connected ({health?.database.latencyMs}ms)
              </span>
            ) : (
              <span className="text-amber-400/90 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                PostgreSQL: Awaiting Docker / Remote Instance
              </span>
            )}
          </div>

          <Link
            to="/architecture"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-300 font-mono text-[11px] underline underline-offset-2 transition-colors"
          >
            Inspect Schema & Docker
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
