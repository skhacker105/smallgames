import { Component, OnInit, ViewChild, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { Subject, interval, takeUntil } from 'rxjs';
import { generateRandomNumbers } from '../../../utils/support.utils';

interface Dot {
  x: number;
  y: number;
  color: string;
}

interface Line {
  path: string;
  color: string;
}

@Component({
  selector: 'app-connecting-dots',
  templateUrl: './connecting-dots.component.html',
  styleUrls: ['./connecting-dots.component.scss']
})
export class ConnectingDotsComponent extends BaseComponent {
  @ViewChild('svgElement') svgElement!: ElementRef<SVGElement>;

  dots: Dot[] = [];
  lines: Line[] = [];
  currentPath: string | null = null;
  isGameOver: boolean = false;
  selectedLevel: number = 1;
  levels: number[] = [1, 2, 3, 4, 5];
  timeSpent = 0;
  private isDrawing = false;
  private startDot: Dot | null = null;
  private currentColor: string | null = null;

  circleRadius = 10;
  colors = ['#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#0ea5e9', '#d946ef', '#eab308', '#64748b', '#f472b6', '#14b8a6', '#1d4ed8', '#facc15']

  gameOverSubject = new Subject<boolean>();

  get dotPairs(): number {
    return +this.selectedLevel * 4;
  }

  constructor(gameDashboardService: GameDashboardService, private renderer: Renderer2) {
    super(gameDashboardService);
  }

  ngAfterViewInit(): void {
    const svg = this.svgElement.nativeElement;

    // Add mouse event listeners
    this.renderer.listen(svg, 'mousedown', (event: MouseEvent) => this.onMouseDown(event));
    this.renderer.listen(svg, 'mousemove', (event: MouseEvent) => this.onMouseMove(event));
    this.renderer.listen(svg, 'mouseup', () => this.onMouseUp());

    // Add touch event listeners
    this.renderer.listen(svg, 'touchstart', (event: TouchEvent) => this.onMouseDown(event));
    this.renderer.listen(svg, 'touchmove', (event: TouchEvent) => this.onMouseMove(event));
    this.renderer.listen(svg, 'touchend', () => this.onMouseUp());
}


  startTimer(): void {
    interval(1000).pipe(takeUntil(this.isComponentActive), takeUntil(this.gameOverSubject))
      .subscribe(() => {
        this.timeSpent++;
        this.saveGameState();
      });
  }

  override getGameState() {
    return {
      dots: this.dots,
      lines: this.lines,
      isGameOver: this.isGameOver,
      selectedLevel: this.selectedLevel,
      timeSpent: this.timeSpent
    };
  }

  override setGameState(gameState: any): void {
    this.dots = gameState.dots;
    this.lines = gameState.lines;
    this.isGameOver = gameState.isGameOver;
    this.selectedLevel = gameState.selectedLevel;
    this.timeSpent = gameState.timeSpent ?? 0;
  }

  saveGameState(): void {
    const gameState = this.getGameState();
    this.gameDashboardService.saveGameState(gameState);
  }

  loadGameState(): void {
    const gameState = this.gameDashboardService.loadGameState();
    if (gameState) {
      this.setGameState(gameState);
      this.startTimer();
    } else {
      setTimeout(() => {
        this.initializeGame();
      }, 10);
    }
  }

  initializeGame(): void {
    this.gameOverSubject.next(true);
    this.timeSpent = 0;
    this.dots = this.generateDots();
    this.isGameOver = false;
    this.lines = [];
    this.saveGameState();
    this.startTimer();
  }

  generateDots(): Dot[] {
    if (!this.svgElement) return [];

    const dotPairs = this.dotPairs; // Level 1 = 2 pairs, Level 2 = 3 pairs, etc.
    const dots: Dot[] = [];
    const svgWidth = this.svgElement.nativeElement.clientWidth;
    const svgHeight = this.svgElement.nativeElement.clientHeight;
    const randomNumbers = generateRandomNumbers(dotPairs * 4);

    // Calculated after removing circle half width
    const calcWidtht = svgWidth - (this.circleRadius * 2);
    const calcHeight = svgHeight - (this.circleRadius * 2);

    // Ensure only 2 dots of the same color
    for (let i = 0; i < dotPairs; i++) {
      const color = this.colors[i % this.colors.length];
      for (let j = 0; j < 2; j++) {
        const xpos = (i * 4) + (j * 2);
        const x = this.circleRadius + Math.floor(randomNumbers[xpos] * calcWidtht);
        const y = this.circleRadius + Math.floor(randomNumbers[xpos + 1] * calcHeight);
        dots.push({
          x: x,
          y: y,
          color: color
        });
      }
    }
    return dots;
  }

  onMouseDown(event: MouseEvent | TouchEvent): void {
      event.preventDefault(); // Prevent default touch behavior
      if (!this.svgElement) return;

      const svgRect = this.svgElement.nativeElement.getBoundingClientRect();
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      const x = clientX - svgRect.left;
      const y = clientY - svgRect.top;
  
      const clickedDot = this.dots.find(dot => Math.sqrt((dot.x - x) ** 2 + (dot.y - y) ** 2) <= 10);
      if (clickedDot) {
          this.isDrawing = true;
          this.startDot = clickedDot;
          this.currentColor = clickedDot.color;
          this.currentPath = `M${clickedDot.x},${clickedDot.y}`;
      }
  }
  
  onMouseMove(event: MouseEvent | TouchEvent): void {
      if (!this.isDrawing) return;
  
      event.preventDefault(); // Prevent default touch behavior
      const svgRect = this.svgElement.nativeElement.getBoundingClientRect();
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      const x = clientX - svgRect.left;
      const y = clientY - svgRect.top;
  
      if (this.currentPath) {
          this.currentPath += ` L${x},${y}`;
      }
  
      // Check if the path reaches another dot of the same color
      const reachedDot = this.dots.find(dot => 
          dot.color === this.currentColor && 
          dot !== this.startDot && 
          Math.sqrt((dot.x - x) ** 2 + (dot.y - y) ** 2) <= 10
      );
  
      if (reachedDot) {
          this.isDrawing = false;
          this.lines.push({ path: `${this.currentPath} L${reachedDot.x},${reachedDot.y}`, color: this.currentColor! });
          this.currentPath = null;
          this.checkGameOver();
      }
  }
  
  onMouseUp(): void {
      this.isDrawing = false;
      this.currentPath = null;
  }

  isPathIntersecting(path1: string, path2: string): boolean {
    // Simplified intersection logic (for demonstration purposes)
    // In a real implementation, use a proper line intersection algorithm
    return false;
  }

  checkGameOver(): void {
    const connectedPairs = this.dots.filter(dot =>
      this.lines.some(line => line.color === dot.color)
    ).length / 2;

    if (connectedPairs === this.dotPairs) {
      this.isGameOver = true;
      this.saveGameState();
      this.gameDashboardService.saveGameDuration(this.timeSpent, this.selectedLevel.toString());
    }
  }

  resetGame(): void {
    this.isGameOver = false;
    setTimeout(() => {
      this.initializeGame();
    }, 10);
  }

  undo(): void {
    if (this.lines.length > 0) {
      this.lines.pop();
      this.saveGameState();
    }
  }

  onLevelChange(): void {
    this.initializeGame();
  }
}