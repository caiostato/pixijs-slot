import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ENGINE_CONFIG } from './config';

/** A single particle in the celebration system */
interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  fadeSpeed: number;
}

/** A coin that falls from the top */
interface FallingCoin {
  container: Container;
  vx: number;
  vy: number;
  gravity: number;
  rotationSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

/**
 * WinCelebration — Agent 2 (Engine) responsibility.
 * 
 * Handles the grand visual celebration when a win occurs:
 * - Confetti particle burst from the center
 * - Falling golden coins
 * - Animated win amount text with scale-in + glow
 * - Screen flash overlay
 * 
 * This class does NOT mutate GameState. It only reads and renders.
 */
export class WinCelebration {
  public container: Container;

  private particles: Particle[] = [];
  private coins: FallingCoin[] = [];
  private winText: Text | null = null;
  private winSubText: Text | null = null;
  private flashOverlay: Graphics | null = null;
  private isActive: boolean = false;
  private isFadingOut: boolean = false;
  private fadeAlpha: number = 1.0;
  private elapsedTime: number = 0;
  private totalWin: number = 0;

  // Animation phases
  private flashPhase: boolean = false;
  private textScaleTarget: number = 1.0;
  private textCurrentScale: number = 0.0;
  private coinSpawnTimer: number = 0;

  // Confetti palette — saturated neon
  private readonly CONFETTI_COLORS = [
    0xFFD700, // Gold
    0xFF6B6B, // Red
    0x4ECDC4, // Teal
    0xFF69B4, // Pink
    0x45B7D1, // Blue
    0xF7DC6F, // Yellow
    0xBB8FCE, // Purple
    0x82E0AA, // Green
    0xFF8C00, // Dark Orange
    0x00CED1, // Dark Cyan
  ];

  constructor() {
    this.container = new Container();
    // Render above everything
    this.container.zIndex = 100;
  }

  /**
   * Triggers the full grand win celebration.
   * Called by GameEngine when PAYOUT_ANIMATION begins.
   */
  public play(totalWin: number) {
    this.clear();
    this.isActive = true;
    this.isFadingOut = false;
    this.fadeAlpha = 1.0;
    this.elapsedTime = 0;
    this.totalWin = totalWin;
    this.flashPhase = true;
    this.textCurrentScale = 0.0;
    this.textScaleTarget = 1.0;
    this.coinSpawnTimer = 0;

    const { CANVAS_WIDTH, CANVAS_HEIGHT } = ENGINE_CONFIG;

    // 1. Screen Flash Overlay — bright white that fades out
    this.flashOverlay = new Graphics()
      .rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      .fill({ color: 0xFFFFFF, alpha: 0.6 });
    this.container.addChild(this.flashOverlay);

    // 2. Initial confetti burst from center
    this.spawnConfettiBurst(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80);

    // 3. Side bursts
    this.spawnConfettiBurst(CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.4, 30);
    this.spawnConfettiBurst(CANVAS_WIDTH * 0.85, CANVAS_HEIGHT * 0.4, 30);

    // 4. Win Text — large animated
    const mainStyle = new TextStyle({
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: [0xFFD700, 0xFFA500, 0xFF8C00],
      stroke: { color: '#000000', width: 6 },
      dropShadow: {
        color: '#FFD700',
        blur: 20,
        distance: 0,
        alpha: 0.8,
      },
      letterSpacing: 4,
    });

    this.winText = new Text({ text: `${totalWin}`, style: mainStyle });
    this.winText.anchor.set(0.5);
    this.winText.x = CANVAS_WIDTH / 2;
    this.winText.y = CANVAS_HEIGHT / 2 - 20;
    this.winText.scale.set(0);
    this.container.addChild(this.winText);

    // Sub label
    const subStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: 3 },
      letterSpacing: 8,
    });

    this.winSubText = new Text({ text: 'YOU WIN!', style: subStyle });
    this.winSubText.anchor.set(0.5);
    this.winSubText.x = CANVAS_WIDTH / 2;
    this.winSubText.y = CANVAS_HEIGHT / 2 + 40;
    this.winSubText.scale.set(0);
    this.container.addChild(this.winSubText);
  }

  /**
   * Spawns a radial burst of confetti particles from a point.
   */
  private spawnConfettiBurst(cx: number, cy: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 10;
      const size = 4 + Math.random() * 8;
      const color = this.CONFETTI_COLORS[Math.floor(Math.random() * this.CONFETTI_COLORS.length)];

      const graphic = new Graphics();

      // Mix of rectangles and circles for visual variety
      if (Math.random() > 0.4) {
        graphic.rect(-size / 2, -size / 4, size, size / 2).fill(color);
      } else {
        graphic.circle(0, 0, size / 2).fill(color);
      }

      graphic.x = cx;
      graphic.y = cy;

      const particle: Particle = {
        graphic,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // Bias upward
        gravity: 0.15 + Math.random() * 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.0,
        maxLife: 1.0,
        fadeSpeed: 0.005 + Math.random() * 0.01,
      };

      this.particles.push(particle);
      this.container.addChild(graphic);
    }
  }

  /**
   * Spawns a single falling coin at a random X position.
   */
  private spawnCoin() {
    const { CANVAS_WIDTH } = ENGINE_CONFIG;
    const coinContainer = new Container();
    const size = 16 + Math.random() * 12;

    // Gold circle with inner highlight
    const outer = new Graphics()
      .circle(0, 0, size)
      .fill(0xFFD700);

    const inner = new Graphics()
      .circle(-size * 0.15, -size * 0.15, size * 0.5)
      .fill({ color: 0xFFFFFF, alpha: 0.3 });

    // Dollar sign or credit symbol
    const style = new TextStyle({ fontSize: size, fill: '#B8860B', fontWeight: 'bold' });
    const symbol = new Text({ text: '$', style });
    symbol.anchor.set(0.5);

    coinContainer.addChild(outer);
    coinContainer.addChild(inner);
    coinContainer.addChild(symbol);
    coinContainer.x = Math.random() * CANVAS_WIDTH;
    coinContainer.y = -30;

    const coin: FallingCoin = {
      container: coinContainer,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      gravity: 0.08 + Math.random() * 0.04,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05,
    };

    this.coins.push(coin);
    this.container.addChild(coinContainer);
  }

  /**
   * Per-frame update. Called by GameEngine's ticker.
   */
  public update(delta: number) {
    if (!this.isActive) return;

    this.elapsedTime += delta * (1 / 60); // Approximate seconds
    const clampedDelta = Math.min(delta, 3);

    // --- Phase 1: Screen Flash (0 - 0.3s) ---
    if (this.flashOverlay) {
      this.flashOverlay.alpha -= 0.03 * clampedDelta;
      if (this.flashOverlay.alpha <= 0) {
        this.container.removeChild(this.flashOverlay);
        this.flashOverlay = null;
        this.flashPhase = false;
      }
    }

    // --- Phase 2: Text Scale-In (elastic ease) ---
    if (this.winText) {
      const diff = this.textScaleTarget - this.textCurrentScale;
      this.textCurrentScale += diff * 0.08 * clampedDelta;

      // Elastic overshoot
      const elastic = this.textCurrentScale + Math.sin(this.elapsedTime * 8) * 0.03;
      this.winText.scale.set(Math.max(0, elastic));

      // Subtle float
      this.winText.y = ENGINE_CONFIG.CANVAS_HEIGHT / 2 - 20 + Math.sin(this.elapsedTime * 2) * 5;
    }

    if (this.winSubText) {
      // Delayed scale-in for sub text
      const subTarget = this.elapsedTime > 0.3 ? 1.0 : 0.0;
      const currentSub = this.winSubText.scale.x;
      const subDiff = subTarget - currentSub;
      this.winSubText.scale.set(Math.max(0, currentSub + subDiff * 0.06 * clampedDelta));
      this.winSubText.y = ENGINE_CONFIG.CANVAS_HEIGHT / 2 + 40 + Math.sin(this.elapsedTime * 2 + 1) * 3;
    }

    // --- Phase 3: Confetti Physics ---
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= 0.99; // Air resistance
      p.vy += p.gravity * clampedDelta;
      p.graphic.x += p.vx * clampedDelta;
      p.graphic.y += p.vy * clampedDelta;
      p.rotation += p.rotationSpeed * clampedDelta;
      p.graphic.rotation = p.rotation;
      p.life -= p.fadeSpeed * clampedDelta;
      p.graphic.alpha = Math.max(0, p.life);

      // Remove dead particles
      if (p.life <= 0 || p.graphic.y > ENGINE_CONFIG.CANVAS_HEIGHT + 50) {
        this.container.removeChild(p.graphic);
        this.particles.splice(i, 1);
      }
    }

    // --- Phase 4: Coin Rain ---
    this.coinSpawnTimer += clampedDelta;
    if (this.coinSpawnTimer > 3 && this.coins.length < 30) {
      this.spawnCoin();
      this.coinSpawnTimer = 0;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.vy += c.gravity * clampedDelta;
      c.container.x += c.vx * clampedDelta + Math.sin(c.wobblePhase) * 0.8;
      c.container.y += c.vy * clampedDelta;
      c.container.rotation += c.rotationSpeed * clampedDelta;
      c.wobblePhase += c.wobbleSpeed * clampedDelta;

      // Remove off-screen coins
      if (c.container.y > ENGINE_CONFIG.CANVAS_HEIGHT + 50) {
        this.container.removeChild(c.container);
        this.coins.splice(i, 1);
      }
    }

    // --- Phase 5: Secondary bursts (staggered) ---
    if (Math.abs(this.elapsedTime - 0.5) < 0.02) {
      this.spawnConfettiBurst(ENGINE_CONFIG.CANVAS_WIDTH * 0.3, ENGINE_CONFIG.CANVAS_HEIGHT * 0.3, 25);
      this.spawnConfettiBurst(ENGINE_CONFIG.CANVAS_WIDTH * 0.7, ENGINE_CONFIG.CANVAS_HEIGHT * 0.3, 25);
    }
    if (Math.abs(this.elapsedTime - 1.0) < 0.02) {
      this.spawnConfettiBurst(ENGINE_CONFIG.CANVAS_WIDTH * 0.5, ENGINE_CONFIG.CANVAS_HEIGHT * 0.5, 40);
    }

    // --- Phase 6: Fade Out ---
    if (this.isFadingOut) {
      this.fadeAlpha -= 0.02 * clampedDelta;
      this.container.alpha = Math.max(0, this.fadeAlpha);

      if (this.fadeAlpha <= 0) {
        this.hardClear();
      }
    }
  }

  /**
   * Initiates a smooth fade-out. The celebration continues to animate
   * while its alpha drops to 0, then hardClear() removes everything.
   */
  public fadeOut() {
    if (!this.isActive) return;
    this.isFadingOut = true;
    // Stop spawning new coins during fade
    this.coinSpawnTimer = -9999;
  }

  /**
   * Instantly removes all visual elements. Used internally after fade
   * completes, or externally when a new spin starts mid-celebration.
   */
  public clear() {
    this.hardClear();
  }

  private hardClear() {
    this.isActive = false;
    this.isFadingOut = false;
    this.fadeAlpha = 1.0;
    this.container.alpha = 1.0;

    this.particles.forEach(p => {
      if (p.graphic.parent) p.graphic.parent.removeChild(p.graphic);
    });
    this.particles = [];
    this.coins.forEach(c => {
      if (c.container.parent) c.container.parent.removeChild(c.container);
    });
    this.coins = [];

    if (this.winText) {
      this.winText = null;
    }
    if (this.winSubText) {
      this.winSubText = null;
    }
    if (this.flashOverlay) {
      this.flashOverlay = null;
    }

    this.container.removeChildren();
  }
}

