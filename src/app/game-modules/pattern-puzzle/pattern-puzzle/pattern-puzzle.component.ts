import { Component } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { Subject, interval, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pattern-puzzle',
  templateUrl: './pattern-puzzle.component.html',
  styleUrl: './pattern-puzzle.component.scss'
})
export class PatternPuzzleComponent extends BaseComponent {
  board: number[][] = []; // Represents the puzzle board
  emptyPosition: { row: number, col: number } = { row: -1, col: -1 }; // Position of the empty space
  gridSize: number = 3; // Default grid size (3x3)
  isGameOver: boolean = false;
  selectedLevel: number = 1; // Default level
  levels: number[] = [1, 2, 3, 4, 5]; // Available levels
  timeSpent = 0;

  gameOverSubject = new Subject<boolean>();

  constructor(gameDashboardService: GameDashboardService) {
    super(gameDashboardService);
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
      board: this.board,
      emptyPosition: this.emptyPosition,
      gridSize: this.gridSize,
      isGameOver: this.isGameOver,
      selectedLevel: this.selectedLevel,
      timeSpent: this.timeSpent
    };
  }

  override setGameState(gameState: any): void {
    this.board = gameState.board;
    this.emptyPosition = gameState.emptyPosition;
    this.gridSize = gameState.gridSize;
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
      this.initializeGame();
    }
  }

  // Initialize the game
  initializeGame(): void {
    this.gameOverSubject.next(true);
    this.timeSpent = 0;
    this.board = this.createPuzzleBoard();
    this.shuffleBoard();
    this.isGameOver = false;
    this.saveGameState();
    this.startTimer();
  }

  // Create the puzzle board
  createPuzzleBoard(): number[][] {
    const board: number[][] = [];
    let count = 1;
    for (let i = 0; i < this.gridSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        board[i][j] = count++;
      }
    }
    board[this.gridSize - 1][this.gridSize - 1] = 0; // Empty space
    this.emptyPosition = { row: this.gridSize - 1, col: this.gridSize - 1 };
    return board;
  }

  // Shuffle the board
  shuffleBoard(): void {
    for (let i = 0; i < 1000; i++) {
      const validMoves = this.getValidMoves();
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      this.moveTile(randomMove.row, randomMove.col, true);
    }
  }

  // Get valid moves (adjacent tiles to the empty space)
  getValidMoves(): { row: number, col: number }[] {
    const moves: { row: number, col: number }[] = [];
    const { row, col } = this.emptyPosition;

    if (row > 0) moves.push({ row: row - 1, col });
    if (row < this.gridSize - 1) moves.push({ row: row + 1, col });
    if (col > 0) moves.push({ row, col: col - 1 });
    if (col < this.gridSize - 1) moves.push({ row, col: col + 1 });

    return moves;
  }

  // Move a tile to the empty space
  moveTile(row: number, col: number, isShuffling = false): void {
    if (this.isValidMove(row, col)) {
      const { row: emptyRow, col: emptyCol } = this.emptyPosition;
      this.board[emptyRow][emptyCol] = this.board[row][col];
      this.board[row][col] = 0;
      this.emptyPosition = { row, col };
      if (!isShuffling) this.checkGameOver();
    }
    this.saveGameState();
  }

  // Check if the move is valid
  isValidMove(row: number, col: number): boolean {
    const { row: emptyRow, col: emptyCol } = this.emptyPosition;
    return (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
  }

  // Check if the game is over
  checkGameOver(): void {
    let count = 1;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.board[i][j] !== count % (this.gridSize * this.gridSize)) {
          return;
        }
        count++;
      }
    }
    this.isGameOver = true;
    this.saveGameState();
    this.gameDashboardService.saveGameDuration(this.timeSpent, this.selectedLevel.toString());
  }

  // Reset the game
  resetGame(): void {
    this.initializeGame();
  }

  // Handle level change
  onLevelChange(): void {
    this.gridSize = +this.selectedLevel + 2; // Level 1 = 3x3, Level 2 = 4x4, etc.
    this.initializeGame();
  }

  puzzeTileDimention(): string {
    return `calc(${Math.floor(100 / this.gridSize)}vw - 10px)`
  }

  solve() {
    let count = 1;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        this.board[i][j] = count % (this.gridSize * this.gridSize);
        count++;
      }
    }
    this.emptyPosition.row = this.gridSize - 1;
    this.emptyPosition.col = this.gridSize - 1;
    this.checkGameOver();
  }
}
