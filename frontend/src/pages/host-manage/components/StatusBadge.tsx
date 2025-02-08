import React from 'react';

interface StatusBadgeProps {
  fetchTime: string;
}

export function StatusBadge({ fetchTime }: StatusBadgeProps) {
  if (!fetchTime) return <>未知</>;
  const isOnline = new Date().getTime() - new Date(fetchTime).getTime() < 5 * 60 * 1000;
  return (
    <div className="flex items-center">
      <div
        className={`mr-2 h-2.5 w-2.5 rounded-full ${
          isOnline ? 'animate-pulse bg-green-500' : 'bg-gray-300'
        }`}
      />
      {isOnline ? '在线' : '离线'}
    </div>
  );
}
