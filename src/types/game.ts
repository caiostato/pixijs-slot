// The strict states of our Finite State Machine
export enum GameState {
  IDLE = 'IDLE',
  BET_REQUESTED = 'BET_REQUESTED',
  SPINNING = 'SPINNING',
  RESULT_RECEIVED = 'RESULT_RECEIVED',
  PAYOUT_ANIMATION = 'PAYOUT_ANIMATION',
}

// Represents a winning combination on the reels
export interface WinLine {
  lineId: number;
  symbolId: number;
  positions: { col: number; row: number }[]; // 0-indexed grid positions for the line path
  payout: number;
}

// The mock server RGS (Remote Gaming Server) response payload
export interface SpinResponse {
  spinId: string;
  // A 2D array representing the final grid of symbols. e.g. [col][row]
  grid: number[][];
  winLines: WinLine[];
  totalWin: number;
  // The definitive source of truth for the player's balance after the spin
  newBalance: number;
}
