import { Container, Graphics } from 'pixi.js';
import { ENGINE_CONFIG } from './config';
import { GameState, SpinResponse, WinLine } from '../types/game';

export class FXManager {
  public container: Container;
  private state: GameState = GameState.IDLE;
  private animationTime: number = 0;
  private winLinesContainers: Container[] = [];

  constructor() {
    this.container = new Container();
    
    // Center to match the ReelManager positioning
    const { COLS, ROWS, REEL_WIDTH, SYMBOL_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } = ENGINE_CONFIG;
    const reelContainerWidth = COLS * REEL_WIDTH;
    const reelContainerHeight = ROWS * SYMBOL_HEIGHT;
    this.container.x = (CANVAS_WIDTH - reelContainerWidth) / 2;
    this.container.y = (CANVAS_HEIGHT - reelContainerHeight) / 2;
  }

  public handleStateChange(newState: GameState, payload: SpinResponse | null) {
    this.state = newState;
    
    if (newState === GameState.SPINNING) {
      this.clearFX();
    } else if (newState === GameState.PAYOUT_ANIMATION && payload) {
      this.animationTime = 0;
      this.drawWinLines(payload.winLines);
    }
  }

  private drawWinLines(winLines: WinLine[]) {
    this.clearFX();
    const { REEL_WIDTH, SYMBOL_HEIGHT } = ENGINE_CONFIG;

    winLines.forEach(line => {
      const lineContainer = new Container();
      
      // Glow/Neon effect underneath
      const glow = new Graphics();
      glow.setStrokeStyle({ width: 15, color: 0xFF5500, alignment: 0.5, alpha: 0.4 });
      
      // Main sharp line
      const main = new Graphics();
      main.setStrokeStyle({ width: 5, color: 0xFFF700, alignment: 0.5 });
      
      line.positions.forEach((pos, index) => {
        const centerX = pos.col * REEL_WIDTH + (REEL_WIDTH / 2);
        const centerY = pos.row * SYMBOL_HEIGHT + (SYMBOL_HEIGHT / 2);

        if (index === 0) {
          glow.moveTo(centerX, centerY);
          main.moveTo(centerX, centerY);
        } else {
          glow.lineTo(centerX, centerY);
          main.lineTo(centerX, centerY);
        }
        
        // Bounding boxes
        const boxX = pos.col * REEL_WIDTH + 10;
        const boxY = pos.row * SYMBOL_HEIGHT + 10;
        const boxW = REEL_WIDTH - 20;
        const boxH = SYMBOL_HEIGHT - 20;
        
        glow.rect(boxX, boxY, boxW, boxH);
        main.rect(boxX, boxY, boxW, boxH);
      });
      
      glow.stroke();
      main.stroke();
      
      lineContainer.addChild(glow);
      lineContainer.addChild(main);
      
      this.winLinesContainers.push(lineContainer);
      this.container.addChild(lineContainer);
    });
  }

  public clearFX() {
    this.container.removeChildren();
    this.winLinesContainers = [];
  }

  public update(delta: number) {
    if (this.state === GameState.PAYOUT_ANIMATION) {
      this.animationTime += delta * 0.15;
      // Pulse alpha between 0.3 and 1.0 to simulate flashing neon
      const pulse = 0.65 + Math.sin(this.animationTime) * 0.35;
      
      this.winLinesContainers.forEach(container => {
        container.alpha = pulse;
      });
    }
  }
}
