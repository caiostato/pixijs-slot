import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ENGINE_CONFIG } from './config';
import { GameState, SpinResponse } from '../types/game';

interface SymbolContainer extends Container {
  symbolId?: number;
}

export class ReelManager {
  public container: Container;
  private reels: Container[] = [];
  private state: GameState = GameState.IDLE;
  private targetGrid: number[][] | null = null;
  private stopPositions: number[] = [];
  private reelsSpinning: boolean[] = [];
  private reelsLanding: boolean[] = [];
  private reelVelocities: number[] = [];
  private stopDelays: number[] = [];

  constructor() {
    this.container = new Container();
    this.initReels();
  }

  private initReels() {
    const { COLS, ROWS, REEL_WIDTH, SYMBOL_HEIGHT } = ENGINE_CONFIG;
    
    const reelContainerWidth = COLS * REEL_WIDTH;
    const reelContainerHeight = ROWS * SYMBOL_HEIGHT;

    // Center the reels on the canvas
    this.container.x = (ENGINE_CONFIG.CANVAS_WIDTH - reelContainerWidth) / 2;
    this.container.y = (ENGINE_CONFIG.CANVAS_HEIGHT - reelContainerHeight) / 2;

    // Create a mask for the visible area (3x3 grid)
    const mask = new Graphics()
      .rect(0, 0, reelContainerWidth, reelContainerHeight)
      .fill(0xffffff);
    this.container.addChild(mask);
    this.container.mask = mask;

    // Build the reels
    for (let c = 0; c < COLS; c++) {
      const reel = new Container();
      reel.x = c * REEL_WIDTH;
      
      // We need extra symbols for the infinite spin illusion (e.g., 5 total: 3 visible + 1 top + 1 bottom)
      const symbolsPerReel = ROWS + 2; 
      
      for (let r = 0; r < symbolsPerReel; r++) {
        const symbol = this.createRandomSymbol();
        // Position them from top (above visible area) to bottom
        symbol.y = (r - 1) * SYMBOL_HEIGHT;
        reel.addChild(symbol);
      }
      
      this.reels.push(reel);
      this.container.addChild(reel);
      this.stopPositions.push(0);
      this.reelsSpinning.push(false);
      this.reelsLanding.push(false);
      this.reelVelocities.push(0);
      this.stopDelays.push(0);
    }
  }

  private createRandomSymbol(id?: number): Container {
    const keys = Object.keys(ENGINE_CONFIG.SYMBOLS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const symbolId = id !== undefined ? id : parseInt(randomKey, 10);
    const { REEL_WIDTH, SYMBOL_HEIGHT, SYMBOLS, COLORS } = ENGINE_CONFIG;

    const symbolContainer = new Container();
    
    // Background block
    const bg = new Graphics()
      .rect(5, 5, REEL_WIDTH - 10, SYMBOL_HEIGHT - 10)
      .fill(COLORS[symbolId as keyof typeof COLORS]);
    
    // Text Emoji
    const style = new TextStyle({
      fontSize: 64,
      align: 'center',
    });
    const text = new Text({ text: SYMBOLS[symbolId as keyof typeof SYMBOLS], style });
    text.anchor.set(0.5);
    text.x = REEL_WIDTH / 2;
    text.y = SYMBOL_HEIGHT / 2;

    symbolContainer.addChild(bg);
    symbolContainer.addChild(text);
    
    // Store ID in container for easy access later
    (symbolContainer as SymbolContainer).symbolId = symbolId;

    return symbolContainer;
  }

  public handleStateChange(newState: GameState, payload: SpinResponse | null) {
    this.state = newState;
    if (newState === GameState.SPINNING) {
      this.targetGrid = null;
      this.reelsSpinning = [true, true, true];
      this.reelsLanding = [false, false, false];
      this.reelVelocities = [0, 0, 0];
    } else if (newState === GameState.RESULT_RECEIVED && payload) {
      this.targetGrid = payload.grid;
      // Stagger the reel stops: 0ms, ~300ms, ~600ms (at 60fps, delta is usually ~1)
      this.stopDelays = [0, 15, 30]; 
    }
  }

  public update(delta: number) {
    if (this.state === GameState.SPINNING || this.state === GameState.RESULT_RECEIVED) {
      const { ROWS, SYMBOL_HEIGHT, SPIN_SPEED } = ENGINE_CONFIG;
      const bottomThreshold = (ROWS + 1) * SYMBOL_HEIGHT;

      this.reels.forEach((reel, colIndex) => {
        // Landing phase (spring physics)
        if (this.reelsLanding[colIndex]) {
          const targetY = 0;
          const tension = 0.08;
          const dampening = 0.75;
          
          // Clamp delta for physics stability
          const physicsDelta = Math.min(delta, 2.0);
          
          this.reelVelocities[colIndex] += (targetY - reel.y) * tension * physicsDelta;
          this.reelVelocities[colIndex] *= Math.pow(dampening, physicsDelta);
          reel.y += this.reelVelocities[colIndex] * physicsDelta;

          // Lock into place when close enough
          if (Math.abs(this.reelVelocities[colIndex]) < 0.5 && Math.abs(reel.y) < 1.0) {
            reel.y = 0;
            this.reelsLanding[colIndex] = false;
          }
          return;
        }

        if (!this.reelsSpinning[colIndex]) {
           // Guarantee that idle reels are physically locked to 0 and cannot drift
           reel.y = 0; 
           return;
        }

        // If we have received the result, wait for delay, then snap and start landing
        if (this.state === GameState.RESULT_RECEIVED && this.targetGrid) {
          if (this.stopDelays[colIndex] > 0) {
            this.stopDelays[colIndex] -= delta;
          } else {
            this.snapReel(reel, colIndex, this.targetGrid[colIndex]);
            this.reelsSpinning[colIndex] = false;
            this.reelsLanding[colIndex] = true;
            return;
          }
        }

        // Infinite Spin Illusion
        for (let i = 0; i < reel.children.length; i++) {
          const symbol = reel.children[i];
          symbol.y += SPIN_SPEED * delta;

          // Wrap around
          if (symbol.y >= bottomThreshold) {
            // Move to the top (above the first visible symbol)
            symbol.y -= reel.children.length * SYMBOL_HEIGHT;
            // Change texture to simulate new symbols
            this.updateSymbolTexture(symbol as Container);
          }
        }
      });
    }
  }

  private updateSymbolTexture(symbol: Container, specificId?: number) {
    // Recreate or mutate the symbol (for performance, mutate in a real app)
    const newSymbol = this.createRandomSymbol(specificId);
    symbol.removeChildren();
    symbol.addChild(...newSymbol.children);
    (symbol as SymbolContainer).symbolId = (newSymbol as SymbolContainer).symbolId;
  }

  private snapReel(reel: Container, colIndex: number, targetCol: number[]) {
    const { SYMBOL_HEIGHT } = ENGINE_CONFIG;
    
    // Completely rebuild the reel container to guarantee zero positional drift
    reel.removeChildren();
    
    for (let i = 0; i < 5; i++) {
      let symbolId: number | undefined = undefined;
      if (i >= 1 && i <= 3) {
        symbolId = targetCol[i - 1];
      }
      
      const symbol = this.createRandomSymbol(symbolId);
      symbol.y = (i - 1) * SYMBOL_HEIGHT;
      reel.addChild(symbol);
    }

    // Pull the entire reel up by just enough to create a slam effect without exposing empty space
    reel.y = -SYMBOL_HEIGHT * 0.8;
    // Set initial velocity to match spin speed for seamless transition
    this.reelVelocities[colIndex] = ENGINE_CONFIG.SPIN_SPEED;
  }

  public areAllReelsStopped(): boolean {
    return this.state === GameState.RESULT_RECEIVED && this.reelsSpinning.every(s => s === false);
  }
}
