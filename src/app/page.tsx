'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameState } from '../types/game';
import BalanceDisplay from '../components/BalanceDisplay';
import { requestMockSpin } from '../server/mockRGS';
import dynamic from 'next/dynamic';
import { AudioManager } from '../audio/AudioManager';
import Header from '../components/Header';
import BetControls from '../components/BetControls';

const GameCanvas = dynamic(() => import('../components/GameCanvas').then(mod => mod.GameCanvas), { ssr: false });

let audioManager: AudioManager | null = null;
if (typeof window !== 'undefined') {
  audioManager = new AudioManager();
}

export default function Home() {
  const { 
    currentState, 
    balance, 
    currentBet, 
    lastResult, 
    setBet, 
    startPayoutAnimation, 
    completeSpin,
    playSpin
  } = useGameStore();

  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSpinClick = () => {
    audioManager?.playClick();
    playSpin(requestMockSpin);
  };

  return (
    <main className="w-screen h-screen bg-neutral-950 text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* 1. Header (Top Bar) */}
      <Header username="Demo Player" balance={balance} />

      {/* 2. Game Viewport (Fills remaining space) */}
      <div className="flex-grow relative flex items-center justify-center p-4">
        
        {/* Background glow or frame for the canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 opacity-50 pointer-events-none" />
        
        <div className="relative w-full max-w-6xl aspect-[16/9] bg-black rounded-xl shadow-2xl border-4 border-neutral-800 overflow-hidden flex items-center justify-center">
          <GameCanvas />
        </div>

        {/* FSM Status Indicator - Floating Top Left */}
        <div className="absolute top-8 left-8 flex flex-col items-start p-3 bg-neutral-900/80 backdrop-blur rounded-lg border border-neutral-800">
          <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-1">State Engine</p>
          <div className="flex gap-2 items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentState === GameState.IDLE ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
              currentState === GameState.SPINNING ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' :
              currentState === GameState.RESULT_RECEIVED ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' :
              currentState === GameState.PAYOUT_ANIMATION ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' :
              'bg-neutral-600'
            }`} />
            <span className="font-mono text-xs text-neutral-300 tracking-widest">{currentState}</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Control Bar */}
      <div className="w-full h-32 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
        
        {/* Left Side: Bet Controls */}
        <div className="flex-1 flex justify-start">
          <BetControls 
            currentBet={currentBet} 
            disabled={currentState !== GameState.IDLE}
            onDecrease={() => { audioManager?.playClick(); setBet(Math.max(1, currentBet - 1)); }}
            onIncrease={() => { audioManager?.playClick(); setBet(currentBet + 1); }}
          />
        </div>

        {/* Center: Main Action (Spin) */}
        <div className="flex-none flex flex-col items-center justify-center px-8">
          <button 
            onClick={handleSpinClick} 
            disabled={currentState !== GameState.IDLE} 
            className="group relative flex items-center justify-center w-40 h-40 -mt-16 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:from-neutral-700 disabled:to-neutral-900 disabled:shadow-none transition-all active:scale-95 border-4 border-neutral-900"
          >
            <div className="absolute inset-2 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors" />
            <span className="text-3xl font-black text-neutral-900 tracking-widest uppercase drop-shadow-sm">
              {currentState === GameState.IDLE ? 'Spin' : '...'}
            </span>
          </button>
        </div>

        {/* Right Side: Extras (Autoplay, Max Bet, or Debug) */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <button 
            onClick={() => { audioManager?.playClick(); setShowDebug(!showDebug) }}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs uppercase tracking-widest text-neutral-400 transition-colors"
          >
            Toggle Debug
          </button>
        </div>
      </div>

      {/* 4. Debug Panel Overlay */}
      {showDebug && (
        <div className="absolute bottom-36 right-8 w-80 bg-black/90 backdrop-blur p-4 rounded-xl border border-neutral-800 z-50 shadow-2xl">
          <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 border-b border-neutral-800 pb-2">Manual FSM Controls</h3>
          
          <div className="flex flex-col gap-2 mb-4">
            <button 
              onClick={() => { audioManager?.playClick(); startPayoutAnimation(); }} 
              disabled={currentState !== GameState.RESULT_RECEIVED} 
              className="bg-amber-600/20 text-amber-500 border border-amber-600/50 hover:bg-amber-600/30 disabled:opacity-30 disabled:hover:bg-amber-600/20 py-2 rounded text-xs uppercase tracking-widest transition-colors"
            >
              Run Payout Anim
            </button>
            <button 
              onClick={() => { audioManager?.playClick(); completeSpin(); }} 
              disabled={currentState !== GameState.PAYOUT_ANIMATION && currentState !== GameState.RESULT_RECEIVED} 
              className="bg-emerald-600/20 text-emerald-500 border border-emerald-600/50 hover:bg-emerald-600/30 disabled:opacity-30 disabled:hover:bg-emerald-600/20 py-2 rounded text-xs uppercase tracking-widest transition-colors"
            >
              Complete Spin (Idle)
            </button>
          </div>

          <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Last RGS Payload</h3>
          <div className="bg-neutral-950 p-2 rounded border border-neutral-900 h-40 overflow-y-auto">
            <pre className="text-[10px] font-mono text-neutral-400">
              {lastResult ? JSON.stringify(lastResult, null, 2) : 'No payload yet.'}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
