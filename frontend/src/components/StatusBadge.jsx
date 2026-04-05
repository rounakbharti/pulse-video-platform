import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, Clock, XCircle, Activity } from 'lucide-react';

export const StatusBadge = ({ type, status }) => {
  if (!status) return null;

  const styleMap = {
    // Processing Statuses
    queued: { color: 'text-text-muted bg-white/5 border-white/10', icon: Clock },
    processing: { color: 'text-accent-primary bg-indigo-500/10 border-indigo-500/20', icon: Activity, spin: true },
    completed: { color: 'text-success bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    failed: { color: 'text-danger bg-red-500/10 border-red-500/20', icon: XCircle },
    
    // Safety Statuses
    pending: { color: 'text-warning bg-amber-500/10 border-amber-500/20', icon: Clock },
    safe: { color: 'text-success bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    flagged: { color: 'text-danger bg-red-500/10 border-red-500/20', icon: AlertTriangle },
  };

  const config = styleMap[status.toLowerCase()];
  
  if (!config) return <span className="text-xs">{status}</span>;
  
  const Icon = config.icon;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border capitalize',
      config.color
    )}>
      <Icon size={14} className={clsx(config.spin && 'animate-spin')} />
      {status}
    </span>
  );
};
