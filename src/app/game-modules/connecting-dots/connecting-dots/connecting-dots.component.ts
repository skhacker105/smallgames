import { Component, OnInit, ViewChild, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { generateHexId } from '../../../utils/support.utils';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { MatDialog } from '@angular/material/dialog';
import { IGameMultiPlayerConnection, IPlayer } from '../../../interfaces';

interface Cell {
  dot: string | null;
  path: string | null; // Store the color of the path
}

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
  board: Cell[][] = [];
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

  constructor(gameDashboardService: GameDashboardService,
    multiPlayerService: MultiPlayerService, dialog: MatDialog) {
    super(gameDashboardService, multiPlayerService, dialog);
  }

  get dotPairs(): number {
    return +this.selectedLevel * 2 + 1;
  }

  resetGame(): void {
    this.gameId = generateHexId(16);
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

  generateBoard(): Cell[][] {
    const size = this.dotPairs * 2 - 1;
    const board: Cell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ dot: null, path: null }))
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
    const color = this.board[this.startCell!.row][this.startCell!.col].dot;
    this.undoStack.push([...this.currentPath]);
    this.currentPath.forEach(cell => {
      this.board[cell.row][cell.col].path = color; // Set path color
    });
    this.currentPath = [];
    this.highlightedPath = [];
    this.saveGameState();
  }

  clearCurrentPath(): void {
    this.currentPath.forEach(cell => {
      if (!this.board[cell.row][cell.col].dot) {
        this.board[cell.row][cell.col].path = null; // Clear path
      }
    });
    this.currentPath = [];
    this.highlightedPath = [];
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      const lastPath = this.undoStack.pop();
      lastPath?.forEach(cell => {
        this.board[cell.row][cell.col].path = null; // Clear path color
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

  getCellStyle(cell: Cell, row: number, col: number): any {
    const isHighlighted = this.highlightedPath.some(c => c.row === row && c.col === col);
    const isStartCell = this.startCell?.row === row && this.startCell?.col === col;

    if (isHighlighted && this.startCell) {
      const dotColor = this.board[this.startCell.row][this.startCell.col].dot;
      return {
        backgroundColor: cell.path ? dotColor : this.lightenColor(dotColor!, 0.5)
      };
    } else if (cell.path) {
      return {
        backgroundColor: cell.path // Use path color
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
  
  setPlayers(): Observable<IPlayer[]> | undefined {
    throw new Error('Method not implemented.');
  }
  setLocalPlayers(players: IPlayer[]): void {
    throw new Error('Method not implemented.');
  }
  setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void {
    throw new Error('Method not implemented.');
  }
  setPlayersAndStartGame(): void {
    throw new Error('Method not implemented.');
  }

  override getGameState(): any {
    return {
      board: this.board,
      selectedLevel: this.selectedLevel,
      timeSpent: this.timeSpent,
      gameOver: this.gameOver,
      undoStack: this.undoStack,
      gameId: this.gameId
    };
  }

  override setGameState(gameState: any): void {
    this.board = gameState.board;
    this.selectedLevel = gameState.selectedLevel;
    this.timeSpent = gameState.timeSpent;
    this.gameOver = gameState.gameOver;
    this.undoStack = gameState.undoStack;
    this.gameId = gameState.gameId ?? generateHexId(16);
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