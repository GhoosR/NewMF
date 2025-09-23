import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'pending' | 'approved' | 'rejected';
  showLabel?: boolean;
}

export function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'text-yellow-500',
          label: 'Pending Approval'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'text-green-500',
          label: 'Approved'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'text-red-500',
          label: 'Rejected'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center ${statusInfo.color}`}>
      {statusInfo.icon}
      {showLabel && <span className="ml-2">{statusInfo.label}</span>}
    </div>
  );
}