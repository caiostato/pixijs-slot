import { Application, Ticker } from 'pixi.js';
import { ENGINE_CONFIG } from './config';
import { ReelManager } from './ReelManager';
import { FXManager } from './FXManager';
import { useGameStore } from '../store/gameStore';
import { GameState, SpinResponse } from '../types/game';

export class GameEngine {
  private app: Application;
  private reelManager: ReelManager;
  private fxManager: FXManager;
  private store: typeof useGameStore | null = null;
  private unsubscribe: (() => void) | null = null;
  private isDestroyed: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.app = new Application();
    this.reelManager = new ReelManager();
    this.fxManager = new FXManager();
  }

  public async init(canvasContainer: HTMLElement, store: typeof useGameStore) {
    this.store = store;
    // 1. Initialize Pixi Application
    await this.app.init({
      width: ENGINE_CONFIG.CANVAS_WIDTH,
      height: ENGINE_CONFIG.CANVAS_HEIGHT,
      backgroundColor: 0x111111,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.isInitialized = true;

    if (this.isDestroyed) {
      this.app.destroy(true, { children: true, texture: true });
      return;
    }

    canvasContainer.appendChild(this.app.canvas);

    // 2. Add containers to stage (Z-index: Reels bottom, FX top)
    this.app.stage.addChild(this.reelManager.container);
    this.app.stage.addChild(this.fxManager.container);

    // 3. Setup Game Loop
    this.app.ticker.add(this.update.bind(this));

    // 4. Subscribe to React Zustand Store
    this.setupStoreSubscription(store);
  }

  private setupStoreSubscription(store: typeof useGameStore) {
    // Subscribe to store changes manually to avoid React re-renders in the Pixi loop
    this.unsubscribe = store.subscribe((state, prevState) => {
      if (state.currentState !== prevState.currentState) {
        this.handleStateChange(state.currentState, state.lastResult);
      }
    });
  }

  private handleStateChange(newState: GameState, payload: SpinResponse | null) {
    // Pass state down to managers
    this.reelManager.handleStateChange(newState, payload);
    this.fxManager.handleStateChange(newState, payload);

    // Engine-level Orchestration
    if (newState === GameState.PAYOUT_ANIMATION) {
      // Simulate animation time, then resolve to IDLE
      setTimeout(() => {
        if (!this.isDestroyed && this.store) {
          this.store.getState().completeSpin();
        }
      }, 2500); // 2.5s payout animation before returning to IDLE
    }
  }

  private update(ticker: Ticker) {
    const delta = ticker.deltaTime;
    this.reelManager.update(delta);
    this.fxManager.update(delta);

    // If reels finished stopping, notify store to transition to PAYOUT_ANIMATION (or IDLE if no win)
    if (this.reelManager.areAllReelsStopped()) {
      // Small timeout to let the snap visually settle
      setTimeout(() => {
        if (!this.isDestroyed && this.store && this.store.getState().currentState === GameState.RESULT_RECEIVED) {
          this.store.getState().startPayoutAnimation();
        }
      }, 200);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.app && this.isInitialized) {
      // Fully destroy WebGL context and remove canvas
      this.app.destroy(true, { children: true, texture: true });
    }
  }
}
