'use client';

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { useGameStore } from '../store/gameStore';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (containerRef.current && !engineRef.current) {
          console.log('GameCanvas: Initializing GameEngine');
          engineRef.current = new GameEngine();
          // Passing the store down strictly follows Agent 1's contract
          await engineRef.current.init(containerRef.current, useGameStore);
          console.log('GameCanvas: GameEngine initialized');
        }
      } catch (err) {
        console.error('GameCanvas: Failed to initialize GameEngine', err);
      }
    };

    init();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center items-center overflow-hidden w-full h-full"
      style={{ minHeight: '600px' }}
    />
  );
};
