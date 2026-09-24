import React from 'react';

interface BalanceDisplayProps {
  balance: number;
}

export default function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest">Balance</p>
      <p className="text-xl font-mono text-emerald-400 font-bold">{balance.toFixed(2)}</p>
    </div>
  );
}
