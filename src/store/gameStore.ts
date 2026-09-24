import { create } from 'zustand';
import { GameState, SpinResponse } from '../types/game';

interface GameStoreState {
  // --- Game State (FSM) ---
  currentState: GameState;
  
  // --- Game Data ---
  balance: number;
  currentBet: number;
  lastResult: SpinResponse | null;
  
  // --- Actions ---
  setBet: (amount: number) => void;
  // Transitions IDLE -> BET_REQUESTED -> SPINNING
  requestSpin: () => boolean;
  // Transitions SPINNING -> RESULT_RECEIVED
  receiveResult: (payload: SpinResponse) => void;
  // Transitions RESULT_RECEIVED -> PAYOUT_ANIMATION
  startPayoutAnimation: () => void;
  // Transitions PAYOUT_ANIMATION/RESULT_RECEIVED -> IDLE
  completeSpin: () => void;
  // Orchestrates the full spin cycle through the FSM
  playSpin: (mockServerCall: (bet: number, balance: number) => Promise<SpinResponse>) => Promise<void>;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentState: GameState.IDLE,
  balance: 10000, // Initial mock balance in cents or credits
  currentBet: 10,
  lastResult: null,

  setBet: (amount) => {
    // Only allow bet changes when not spinning
    if (get().currentState === GameState.IDLE) {
      set({ currentBet: amount });
    }
  },

  requestSpin: () => {
    const { currentState, balance, currentBet } = get();
    
    // FSM Guard: Only spin if idle and funds are sufficient
    if (currentState !== GameState.IDLE || balance < currentBet) {
      console.warn("Cannot spin: Not idle or insufficient balance.");
      return false; // return false to indicate failure
    }

    // Deduct bet from local balance for immediate UI feedback.
    set({ 
      currentState: GameState.BET_REQUESTED,
      balance: balance - currentBet, 
      lastResult: null 
    });

    set({ currentState: GameState.SPINNING });
    return true; // return true to indicate success
  },

  receiveResult: (payload) => {
    const { currentState } = get();
    
    // FSM Guard: Can only receive results if we are currently spinning
    if (currentState !== GameState.SPINNING) {
      console.warn("Cannot receive result: Game is not spinning.");
      return;
    }

    set({ 
      currentState: GameState.RESULT_RECEIVED,
      lastResult: payload 
    });
  },

  startPayoutAnimation: () => {
    const { currentState, lastResult } = get();
    
    // FSM Guard: Must have received result to start payout
    if (currentState !== GameState.RESULT_RECEIVED) {
      return;
    }

    if (lastResult && lastResult.totalWin > 0) {
      set({ currentState: GameState.PAYOUT_ANIMATION });
    } else {
      // If no win, skip the payout animation phase
      get().completeSpin();
    }
  },

  completeSpin: () => {
    const { currentState, lastResult } = get();
    
    // FSM Guard: Can only complete spin after result or payout
    if (currentState === GameState.RESULT_RECEIVED || currentState === GameState.PAYOUT_ANIMATION) {
      set({ 
        currentState: GameState.IDLE,
        // Reconcile balance with the definitive server response
        balance: lastResult ? lastResult.newBalance : get().balance 
      });
    }
  },

  playSpin: async (mockServerCall) => {
    const store = get();
    // 1. Try to transition to SPINNING
    const success = store.requestSpin();
    if (!success) return;

    // We must grab the fresh state *after* requestSpin
    const { currentBet, balance } = get();

    // 2. Await Server
    try {
      const payload = await mockServerCall(currentBet, balance + currentBet); // Balance before deduction
      
      // 3. Deliver Result
      get().receiveResult(payload);
    } catch (e) {
      console.error("Server request failed", e);
      // In a real app, we'd handle error states here.
    }
  }
}));
