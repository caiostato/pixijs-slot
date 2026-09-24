import React from 'react';
import BalanceDisplay from './BalanceDisplay';

interface HeaderProps {
  username: string;
  balance: number;
}

export default function Header({ username, balance }: HeaderProps) {
  return (
    <header className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
          {username.charAt(0)}
        </div>
        <div className="hidden sm:block">
          <p className="text-neutral-400 text-xs uppercase tracking-widest">Player</p>
          <p className="font-bold text-white tracking-wide">{username}</p>
        </div>
      </div>

      <div className="bg-neutral-950 px-6 py-2 rounded-lg border border-neutral-800 shadow-inner">
        <BalanceDisplay balance={balance} />
      </div>
    </header>
  );
}
