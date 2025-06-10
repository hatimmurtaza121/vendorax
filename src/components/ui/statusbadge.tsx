import React from 'react';
import clsx from 'clsx';

type StatusBadgeProps = {
  type: 'transactionType' | 'paymentStatus' | 'orderType' | 'orderStatus';
  value: string;
};

const statusColors: Record<string, Record<string, string>> = {
  transactionType: {
    income: 'border-[#2563EB] text-[#2563EB]',    // Deeper Blue
    expense: 'border-[#DC2626] text-[#DC2626]',   // Deeper Red
  },
  paymentStatus: {
    paid: 'border-[#15803D] text-[#15803D]',      // Deeper Emerald Green
    unpaid: 'border-[#DC2626] text-[#DC2626]',    // Deeper Red
    partial: 'border-[#D97706] text-[#D97706]',   // Rich Amber Gold
  },
  orderType: {
    purchase: 'border-[#5B21B6] text-[#5B21B6]', // Deep Violet
    sale: 'border-[#2563EB] text-[#2563EB]',    // Deeper Blue
  },
  orderStatus: {
    completed: 'border-[#15803D] text-[#15803D]',      // Deeper Emerald Green
    pending: 'border-[#D97706] text-[#D97706]',   // Rich Amber Gold
    cancelled: 'border-[#374151] text-[#374151]',      // Deep Cool Gray
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const colorClass = statusColors[type]?.[value] || 'bg-gray-200 text-black';

  return (
    <span
      className={`flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium capitalize border-2 w-[90px] ${colorClass}`}
    >
      {value}
    </span>
  );
};

export default StatusBadge;
