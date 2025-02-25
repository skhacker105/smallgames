import { Component, OnInit, ViewChild, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { Subject, interval, takeUntil } from 'rxjs';
import { generateRandomNumbers } from '../../../utils/support.utils';


interface Cell {
  dot: string | null;
  path: string | null;
}

@Component({
  selector: 'app-connecting-dots',
  templateUrl: './connecting-dots.component.html',
  styleUrls: ['./connecting-dots.component.scss']
})
export class ConnectingDotsComponent extends BaseComponent {
  board: { dot: string | null, path: boolean }[][] = [];
  selectedLevel = 1;
  levels = [1, 2, 3, 4, 5];
  dotColors = ['#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#0ea5e9', '#d946ef', '#eab308', '#64748b', '#f472b6', '#14b8a6', '#1d4ed8', '#facc15'];
  timeSpent = 0;
  gameOver = false;
  isDragging = false;
  startCell: { row: number, col: number } | null = null;
  currentPath: { row: number, col: number }[] = [];
  undoStack: { row: number, col: number }[][] = [];
  highlightedPath: { row: number, col: number }[] = [];

  gameOverSubject = new Subject<boolean>();

  constructor(gameDashboardService: GameDashboardService) {
    super(gameDashboardService);
  }

  get dotPairs(): number {
    return +this.selectedLevel * 2 + 1;
  }

  resetGame(): void {
    this.board = this.generateBoard();
    this.timeSpent = 0;
    this.gameOver = false;
    this.isDragging = false;
    this.startCell = null;
    this.currentPath = [];
    this.undoStack = [];
    this.highlightedPath = [];
    this.saveGameState();
    this.startTimer();
  }

  generateBoard(): { dot: string | null, path: boolean }[][] {
    const size = this.dotPairs * 2 - 1;
    const board: any = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ dot: null, path: false }))
    );

    const colors = this.dotColors.slice(0, this.dotPairs);
    colors.forEach(color => {
      for (let i = 0; i < 2; i++) {
        let row, col;
        do {
          row = Math.floor(Math.random() * size);
          col = Math.floor(Math.random() * size);
        } while (board[row][col].dot !== null);
        board[row][col].dot = color;
      }
    });

    return board;
  }

  onMouseDown(row: number, col: number): void {
    if (this.board[row][col].dot && !this.board[row][col].path) {
      this.isDragging = true;
      this.startCell = { row, col };
      this.currentPath = [{ row, col }];
      this.highlightedPath = [{ row, col }];
    }
  }

  onMouseEnter(row: number, col: number): void {
    if (this.isDragging && this.startCell) {
      const lastCell = this.currentPath[this.currentPath.length - 1];
      const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1; // Only horizontal/vertical moves
      if (isAdjacent && !this.board[row][col].path) {
        if (this.board[row][col].dot === this.board[this.startCell.row][this.startCell.col].dot) {
          this.currentPath.push({ row, col });
          this.connectPath();
          this.isDragging = false;
          this.startCell = null;
          this.highlightedPath = [];
          this.checkGameOver();
        } else if (!this.board[row][col].dot) {
          this.currentPath.push({ row, col });
          this.highlightedPath = [...this.currentPath];
        }
      }
    }
  }

  onMouseUp(): void {
    if (this.isDragging) {
      this.clearCurrentPath();
      this.isDragging = false;
      this.startCell = null;
      this.highlightedPath = [];
    }
  }

  connectPath(): void {
    this.undoStack.push([...this.currentPath]);
    this.currentPath.forEach(cell => {
      this.board[cell.row][cell.col].path = true;
    });
    this.currentPath = [];
    this.saveGameState();
  }

  clearCurrentPath(): void {
    this.currentPath.forEach(cell => {
      if (!this.board[cell.row][cell.col].dot) {
        this.board[cell.row][cell.col].path = false;
      }
    });
    this.currentPath = [];
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      const lastPath = this.undoStack.pop();
      lastPath?.forEach(cell => {
        this.board[cell.row][cell.col].path = false;
      });
      this.saveGameState();
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  checkGameOver(): void {
    const allConnected = this.board.every(row =>
      row.every(cell => !cell.dot || cell.path)
    );
    if (allConnected) {
      this.gameOver = true;
      this.gameOverSubject.next(true);
      this.gameDashboardService.saveGameDuration(this.timeSpent, this.selectedLevel.toString());
    }
  }

  getCellStyle(cell: { dot: string | null, path: boolean }, row: number, col: number): any {
    const isHighlighted = this.highlightedPath.some(c => c.row === row && c.col === col);
    const isStartCell = this.startCell?.row === row && this.startCell?.col === col;

    if (isHighlighted && this.startCell) {
      const dotColor = this.board[this.startCell.row][this.startCell.col].dot;
      return {
        backgroundColor: cell.path ? dotColor : this.lightenColor(dotColor!, 0.5)
      };
    } else if (cell.path) {
      return {
        backgroundColor: cell.dot
      };
    } else {
      return {
        backgroundColor: 'transparent'
      };
    }
  }

  lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const rgb = parseInt(hex, 16);
    const r = (rgb >> 16) + Math.round((255 - (rgb >> 16)) * amount);
    const g = ((rgb >> 8) & 0x00FF) + Math.round((255 - ((rgb >> 8) & 0x00FF)) * amount);
    const b = (rgb & 0x0000FF) + Math.round((255 - (rgb & 0x0000FF)) * amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  onLevelChange(event: Event): void {
    this.selectedLevel = +(event.target as HTMLSelectElement).value;
    this.resetGame();
  }

  startTimer(): void {
    interval(1000).pipe(takeUntil(this.isComponentActive), takeUntil(this.gameOverSubject))
      .subscribe(() => {
        this.timeSpent++;
        this.saveGameState();
      });
  }

  override getGameState(): any {
    return {
      board: this.board,
      selectedLevel: this.selectedLevel,
      timeSpent: this.timeSpent,
      gameOver: this.gameOver,
      undoStack: this.undoStack
    };
  }

  override setGameState(gameState: any): void {
    this.board = gameState.board;
    this.selectedLevel = gameState.selectedLevel;
    this.timeSpent = gameState.timeSpent;
    this.gameOver = gameState.gameOver;
    this.undoStack = gameState.undoStack;
    if (!this.gameOver) this.startTimer();
  }

  saveGameState(): void {
    const gameState = this.getGameState();
    this.gameDashboardService.saveGameState(gameState);
  }

  loadGameState(): void {
    const gameState = this.gameDashboardService.loadGameState();
    if (gameState) {
      this.setGameState(gameState);
    } else {
      this.resetGame();
    }
  }
}