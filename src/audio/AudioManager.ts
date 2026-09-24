import { Howl } from 'howler';
import { useGameStore } from '../store/gameStore';
import { GameState } from '../types/game';

export class AudioManager {
  public sounds: Record<string, Howl>;
  private unsubscribe: () => void;
  private isMuted: boolean = false;

  constructor() {
    // 1. Preload Assets
    // In a real project, these paths would point to valid .mp3/.ogg files in the /public dir
    this.sounds = {
      idle: new Howl({ src: ['/audio/idle-loop.wav'], loop: true, volume: 0.1 }),
      spin: new Howl({ src: ['/audio/spin-loop.wav'], loop: true, volume: 0.15 }),
      stop: new Howl({ src: ['/audio/reel-stop.wav'], volume: 0.3 }),
      win: new Howl({ src: ['/audio/win-chime.wav'], volume: 0.3 }),
      click: new Howl({ src: ['/audio/click.wav'], volume: 0.2 }),
    };

    // 2. Subscribe to Zustand FSM
    this.unsubscribe = useGameStore.subscribe(
      (state, previousState) => {
        if (state.currentState !== previousState.currentState) {
          this.handleStateChange(state.currentState, previousState.currentState);
        }
      }
    );

    // Initial state handling
    if (useGameStore.getState().currentState === GameState.IDLE) {
      // this.sounds.idle.play(); // Commented out to prevent auto-play policy issues in browser testing
    }
  }

  private handleStateChange(currentState: GameState, previousState: GameState) {
    if (this.isMuted) return;

    switch (currentState) {
      case GameState.SPINNING:
        this.sounds.idle.stop();
        this.sounds.spin.play();
        break;

      case GameState.RESULT_RECEIVED:
        // When reels conceptually stop, we play the stop thud.
        // In a real scenario, this might be triggered by Agent 2 (Engine) per-reel, 
        // but subscribing to the FSM here gives us a solid baseline.
        this.sounds.spin.stop();
        this.sounds.stop.play();
        break;

      case GameState.PAYOUT_ANIMATION:
        this.sounds.win.play();
        break;

      case GameState.IDLE:
        if (previousState !== GameState.IDLE) {
          this.sounds.spin.stop();
          this.sounds.win.stop();
          // this.sounds.idle.play();
        }
        break;
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  public playClick() {
    if (!this.isMuted) this.sounds.click.play();
  }

  public destroy() {
    this.unsubscribe();
    Object.values(this.sounds).forEach(sound => sound.unload());
  }
}

// Export a singleton instance creator if needed, or instantiate at app root.
