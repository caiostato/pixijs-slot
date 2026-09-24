import { SpinResponse, WinLine } from '../types/game';

export interface SymbolData {
  id: number;
  name: string;
  multiplier: number;
  weight: number; // For RNG probability pool
}

// 1. Math Model: Symbol Definitions
// Higher weight = more frequent. Higher multiplier = rarer.
export const SYMBOLS: SymbolData[] = [
  { id: 1, name: 'Cherry', multiplier: 2, weight: 50 },
  { id: 2, name: 'Lemon', multiplier: 3, weight: 30 },
  { id: 3, name: 'Orange', multiplier: 5, weight: 20 },
  { id: 4, name: 'Plum', multiplier: 10, weight: 10 },
  { id: 5, name: 'Bell', multiplier: 20, weight: 5 },
  { id: 6, name: 'Diamond', multiplier: 50, weight: 2 },
];

// Build a weighted pool for O(1) random selection
const RNG_POOL: number[] = [];
SYMBOLS.forEach((symbol) => {
  for (let i = 0; i < symbol.weight; i++) {
    RNG_POOL.push(symbol.id);
  }
});

/**
 * 2. Grid Generation
 * Generates a 3x3 grid of symbols.
 * Returns: Array of columns. grid[col][row]
 */
export function generateGrid(): number[][] {
  const cols = 3;
  const rows = 3;
  const grid: number[][] = [];

  for (let c = 0; c < cols; c++) {
    const column: number[] = [];
    for (let r = 0; r < rows; r++) {
      const randomIdx = Math.floor(Math.random() * RNG_POOL.length);
      column.push(RNG_POOL[randomIdx]);
    }
    grid.push(column);
  }
  return grid;
}

/**
 * 3. Payline Evaluation
 * Checks for matches across defined paylines.
 * For this prototype, we define 3 horizontal lines and 2 diagonals.
 */
export function evaluateWinLines(grid: number[][], betAmount: number): WinLine[] {
  const winLines: WinLine[] = [];
  
  // Define paylines by [col, row] coordinates
  const lines = [
    { id: 1, name: 'Top Row', positions: [{c:0,r:0}, {c:1,r:0}, {c:2,r:0}] },
    { id: 2, name: 'Middle Row', positions: [{c:0,r:1}, {c:1,r:1}, {c:2,r:1}] },
    { id: 3, name: 'Bottom Row', positions: [{c:0,r:2}, {c:1,r:2}, {c:2,r:2}] },
    { id: 4, name: 'Diagonal Down', positions: [{c:0,r:0}, {c:1,r:1}, {c:2,r:2}] },
    { id: 5, name: 'Diagonal Up', positions: [{c:0,r:2}, {c:1,r:1}, {c:2,r:0}] },
  ];

  lines.forEach((line) => {
    const firstSymbolId = grid[line.positions[0].c][line.positions[0].r];
    let isMatch = true;

    // Check if all symbols on the line match the first symbol
    for (let i = 1; i < line.positions.length; i++) {
      if (grid[line.positions[i].c][line.positions[i].r] !== firstSymbolId) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      const symbolData = SYMBOLS.find(s => s.id === firstSymbolId);
      if (symbolData) {
        winLines.push({
          lineId: line.id,
          symbolId: firstSymbolId,
          positions: line.positions.map(p => ({ col: p.c, row: p.r })),
          payout: betAmount * symbolData.multiplier
        });
      }
    }
  });

  return winLines;
}

/**
 * 4. Asynchronous Network Simulation
 * Simulates a server request with latency.
 */
export async function requestMockSpin(betAmount: number, currentBalance: number): Promise<SpinResponse> {
  // Simulate network latency (500ms - 1500ms)
  const latency = Math.floor(Math.random() * 1000) + 500;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Deduct bet on server side (server is the source of truth)
      const balanceAfterBet = currentBalance - betAmount;

      // 2. Generate Outcome
      const grid = generateGrid();
      const winLines = evaluateWinLines(grid, betAmount);
      
      // 3. Calculate total win
      const totalWin = winLines.reduce((sum, line) => sum + line.payout, 0);

      // 4. Calculate new balance
      const newBalance = balanceAfterBet + totalWin;

      // 5. Construct payload
      const response: SpinResponse = {
        spinId: Math.random().toString(36).substring(2, 11),
        grid,
        winLines,
        totalWin,
        newBalance
      };

      resolve(response);
    }, latency);
  });
}
