import React from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface StatusTextProps {
  status: 'pending' | 'approved' | 'rejected' | string;
}

export const StatusText: React.FC<StatusTextProps> = ({ status }) => {
  const styles: Record<string, string> = {
    "approved": "text-green-600",
    "pending": "text-gray-400",
    "rejected": "text-red-600",
  };

  const Icons: Record<string, any> = {
    "approved": CheckCircle,
    "pending": Clock,
    "rejected": XCircle,
  };

  const Icon = Icons[status.toLowerCase()] || Clock;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", styles[status.toLowerCase()] || "text-gray-500")}>
      <Icon size={14} />
      {status.replace('_', ' ')}
    </span>
  );
};