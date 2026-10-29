import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';

  switch (status) {
    case 'FUNDED':
    case 'PROCESSED':
    case 'APPROVED':
    case 'SUCCESS':
    case 'ACTIVE':
    case 'SETTLED':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;

    case 'PARTIALLY_RELEASED':
    case 'IN_TRANSIT':
    case 'SUBMITTED':
      badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;

    case 'CREATED':
    case 'PAYMENT_PENDING':
    case 'PENDING':
    case 'UNDER_REVIEW':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;

    case 'FAILED':
    case 'CANCELLED':
    case 'SUSPENDED':
    case 'REJECTED':
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
      dotColor = 'bg-rose-500';
      break;

    case 'RELEASED':
    case 'DISBURSED':
      badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
      dotColor = 'bg-blue-500';
      break;

    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${badgeStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
