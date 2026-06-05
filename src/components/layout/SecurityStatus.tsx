import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SecurityStatusProps {
  status: 'secure' | 'warning' | 'critical';
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ status }) => {
  const styles = {
    secure: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    critical: 'bg-red-50 text-red-700 border-red-100',
  };

  const labels = {
    secure: 'System Secure',
    warning: 'Security Warning',
    critical: 'Critical Alert',
  };

  return (
    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <ShieldAlert size={14} />
      {labels[status]}
    </div>
  );
};