import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { MatDialog } from '@angular/material/dialog';
import { generateHexId } from '../../../utils/support.utils';
import { IGameMultiPlayerConnection, IPlayer } from '../../../interfaces';

@Component({
  selector: 'app-image-puzzle',
  templateUrl: './image-puzzle.component.html',
  styleUrl: './image-puzzle.component.scss'
})
export class ImagePuzzleComponent extends BaseComponent {
  board: (string | null)[][] = []; // Represents the puzzle board
  emptyPosition: { row: number, col: number } = { row: -1, col: -1 }; // Position of the empty space
  gridSize: number = 3; // Default grid size (3x3)
  isGameOver: boolean = false;
  selectedLevel: number = 1; // Default level
  levels: number[] = [1, 2, 3, 4, 5]; // Available levels
  timeSpent = 0;
  images: string[] = [
    'assets/imagePuzzle/image1.jpg',
    'assets/imagePuzzle/image2.jpg',
    // 'assets/imagePuzzle/image3.jpg',
    // 'assets/imagePuzzle/image4.jpg',
    // 'assets/imagePuzzle/image5.jpg',
    // 'assets/imagePuzzle/image6.jpg',
    // 'assets/imagePuzzle/image7.jpg',
    // 'assets/imagePuzzle/image8.jpg',
    // 'assets/imagePuzzle/image9.jpg',
    // 'assets/imagePuzzle/image10.jpg'
  ];
  currentImage: string = '';

  gameOverSubject = new Subject<boolean>();

  constructor(gameDashboardService: GameDashboardService,
    multiPlayerService: MultiPlayerService, dialog: MatDialog) {
    super(gameDashboardService, multiPlayerService, dialog);
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
      timeSpent: this.timeSpent,
      currentImage: this.currentImage,
      gameId: this.gameId
    };
  }

  override setGameState(gameState: any): void {
    this.board = gameState.board;
    this.emptyPosition = gameState.emptyPosition;
    this.gridSize = gameState.gridSize;
    this.isGameOver = gameState.isGameOver;
    this.selectedLevel = gameState.selectedLevel;
    this.timeSpent = gameState.timeSpent ?? 0;
    this.currentImage = gameState.currentImage;
    this.gameId = gameState.gameId ?? generateHexId(16);
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
    this.gameId = generateHexId(16);
    this.gameOverSubject.next(true);
    this.timeSpent = 0;
    this.currentImage = this.images[Math.floor(Math.random() * this.images.length)];
    this.board = this.createPuzzleBoard();
    this.shuffleBoard();
    this.isGameOver = false;
    this.saveGameState();
    this.startTimer();
  }

  // Create the puzzle board
  createPuzzleBoard(): (string | null)[][] {
    const board: (string | null)[][] = [];
    for (let i = 0; i < this.gridSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        if (i === this.gridSize - 1 && j === this.gridSize - 1) {
          board[i][j] = null; // Empty space
        } else {
          const x = (j / this.gridSize) * 100;
          const y = (i / this.gridSize) * 100;
          board[i][j] = `-${x}% -${y}%`;
        }
      }
    }
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
      this.board[row][col] = null;
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
    let count = 0;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (i === this.gridSize - 1 && j === this.gridSize - 1) {
          if (this.board[i][j] !== null) {
            return;
          }
        } else {
          const expectedX = (j / this.gridSize) * 100;
          const expectedY = (i / this.gridSize) * 100;
          const expectedPosition = `-${expectedX}% -${expectedY}%`;
          if (this.board[i][j] !== expectedPosition) {
            return;
          }
        }
        count++;
      }
    }
    this.isGameOver = true;
    this.saveGameState();
    this.gameDashboardService.saveGameDuration(this.gameId, this.timeSpent, this.selectedLevel.toString());
  }

  // Reset the game
  resetGame(): void {
    this.initializeGame();
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

  // Handle level change
  onLevelChange(): void {
    this.gridSize = +this.selectedLevel + 2; // Level 1 = 3x3, Level 2 = 4x4, etc.
    this.initializeGame();
  }

  puzzeTileDimention(): string {
    return `calc(${Math.floor(100 / this.gridSize)}vw - 10px)`;
  }

  solve() {
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (i === this.gridSize - 1 && j === this.gridSize - 1) {
          this.board[i][j] = null;
        } else {
          const x = (j / this.gridSize) * 100;
          const y = (i / this.gridSize) * 100;
          this.board[i][j] = `-${x}% -${y}%`;
        }
      }
    }
    this.emptyPosition.row = this.gridSize - 1;
    this.emptyPosition.col = this.gridSize - 1;
    this.checkGameOver();
  }

  checkWinner() {}
}
