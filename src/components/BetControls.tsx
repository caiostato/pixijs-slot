import React from 'react';

interface BetControlsProps {
  currentBet: number;
  disabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function BetControls({ currentBet, disabled, onIncrease, onDecrease }: BetControlsProps) {
  return (
    <div className="flex flex-col items-center bg-neutral-900 p-4 rounded-lg border border-neutral-800 shadow-inner">
      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Total Bet</p>
      <div className="flex items-center gap-3">
        <button 
          disabled={disabled}
          onClick={onDecrease}
          className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors font-bold text-xl border border-neutral-700"
        >-</button>
        <p className="text-2xl font-mono w-20 text-center font-bold text-white">{currentBet}</p>
        <button 
          disabled={disabled}
          onClick={onIncrease}
          className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors font-bold text-xl border border-neutral-700"
        >+</button>
      </div>
    </div>
  );
}
