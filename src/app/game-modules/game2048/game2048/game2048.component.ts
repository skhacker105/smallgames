import { Component, OnInit } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { MatDialog } from '@angular/material/dialog';
import { generateHexId } from '../../../utils/support.utils';
import { Observable } from 'rxjs';
import { IGameMultiPlayerConnection, IPlayer } from '../../../interfaces';

@Component({
  selector: 'app-game2048',
  templateUrl: './game2048.component.html',
  styleUrl: './game2048.component.scss'
})
export class Game2048Component extends BaseComponent {
  board: number[][] = []; // Represents the 2048 game board
  gridSize: number = 6; // Default grid size (4x4)
  isGameOver: boolean = false;
  score: number = 0;

  constructor(gameDashboardService: GameDashboardService, mps: MultiPlayerService, dialog: MatDialog) {
    super(gameDashboardService, mps, dialog)
  }
  
  override getGameState() {
    return {
      board: this.board,
      score: this.score,
      isGameOver: this.isGameOver,
      gameId: this.gameId
    }
  }

  override setGameState(gameState: any): void {
    this.board = gameState.board;
    this.score = gameState.score;
    this.isGameOver = gameState.isGameOver;
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
    } else {
      this.initializeGame();
    }
  }

  // Initialize the game
  initializeGame(): void {
    this.gameId = generateHexId(16);
    this.board = this.createGameBoard();
    this.addRandomTile();
    this.addRandomTile();
    this.isGameOver = false;
    this.score = 0;
    this.saveGameState();
  }

  // Create the game board
  createGameBoard(): number[][] {
    const board: number[][] = [];
    for (let i = 0; i < this.gridSize; i++) {
      board[i] = Array(this.gridSize).fill(0);
    }
    return board;
  }

  // Add a random tile (90% chance for 2, 10% chance for 4)
  addRandomTile(): void {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  // Get empty cells
  getEmptyCells(): { row: number, col: number }[] {
    const emptyCells: { row: number, col: number }[] = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.board[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }
    return emptyCells;
  }

  // Handle swipe direction
  changeDirection(direction: string): void {
    if (this.isGameOver) return;

    let boardChanged = false;
    switch (direction) {
      case 'UP':
        boardChanged = this.moveUp();
        break;
      case 'DOWN':
        boardChanged = this.moveDown();
        break;
      case 'LEFT':
        boardChanged = this.moveLeft();
        break;
      case 'RIGHT':
        boardChanged = this.moveRight();
        break;
    }

    if (boardChanged) {
      this.addRandomTile();
      this.checkGameOver();
      this.saveGameState();
    }
  }

  // Move tiles up
  moveUp(): boolean {
    let boardChanged = false;
    for (let col = 0; col < this.gridSize; col++) {
      for (let row = 1; row < this.gridSize; row++) {
        if (this.board[row][col] !== 0) {
          let currentRow = row;
          while (currentRow > 0 && this.board[currentRow - 1][col] === 0) {
            this.board[currentRow - 1][col] = this.board[currentRow][col];
            this.board[currentRow][col] = 0;
            currentRow--;
            boardChanged = true;
          }
          if (currentRow > 0 && this.board[currentRow - 1][col] === this.board[currentRow][col]) {
            this.board[currentRow - 1][col] *= 2;
            this.score += this.board[currentRow - 1][col];
            this.board[currentRow][col] = 0;
            boardChanged = true;
          }
        }
      }
    }
    return boardChanged;
  }

  // Move tiles down
  moveDown(): boolean {
    let boardChanged = false;
    for (let col = 0; col < this.gridSize; col++) {
      for (let row = this.gridSize - 2; row >= 0; row--) {
        if (this.board[row][col] !== 0) {
          let currentRow = row;
          while (currentRow < this.gridSize - 1 && this.board[currentRow + 1][col] === 0) {
            this.board[currentRow + 1][col] = this.board[currentRow][col];
            this.board[currentRow][col] = 0;
            currentRow++;
            boardChanged = true;
          }
          if (currentRow < this.gridSize - 1 && this.board[currentRow + 1][col] === this.board[currentRow][col]) {
            this.board[currentRow + 1][col] *= 2;
            this.score += this.board[currentRow + 1][col];
            this.board[currentRow][col] = 0;
            boardChanged = true;
          }
        }
      }
    }
    return boardChanged;
  }

  // Move tiles left
  moveLeft(): boolean {
    let boardChanged = false;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 1; col < this.gridSize; col++) {
        if (this.board[row][col] !== 0) {
          let currentCol = col;
          while (currentCol > 0 && this.board[row][currentCol - 1] === 0) {
            this.board[row][currentCol - 1] = this.board[row][currentCol];
            this.board[row][currentCol] = 0;
            currentCol--;
            boardChanged = true;
          }
          if (currentCol > 0 && this.board[row][currentCol - 1] === this.board[row][currentCol]) {
            this.board[row][currentCol - 1] *= 2;
            this.score += this.board[row][currentCol - 1];
            this.board[row][currentCol] = 0;
            boardChanged = true;
          }
        }
      }
    }
    return boardChanged;
  }

  // Move tiles right
  moveRight(): boolean {
    let boardChanged = false;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = this.gridSize - 2; col >= 0; col--) {
        if (this.board[row][col] !== 0) {
          let currentCol = col;
          while (currentCol < this.gridSize - 1 && this.board[row][currentCol + 1] === 0) {
            this.board[row][currentCol + 1] = this.board[row][currentCol];
            this.board[row][currentCol] = 0;
            currentCol++;
            boardChanged = true;
          }
          if (currentCol < this.gridSize - 1 && this.board[row][currentCol + 1] === this.board[row][currentCol]) {
            this.board[row][currentCol + 1] *= 2;
            this.score += this.board[row][currentCol + 1];
            this.board[row][currentCol] = 0;
            boardChanged = true;
          }
        }
      }
    }
    return boardChanged;
  }

  // Check if the game is over
  checkGameOver(): void {
    if (this.getEmptyCells().length === 0) {
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          if ((i < this.gridSize - 1 && this.board[i][j] === this.board[i + 1][j]) ||
            (j < this.gridSize - 1 && this.board[i][j] === this.board[i][j + 1])) {
            return;
          }
        }
      }
      this.isGameOver = true;
      this.gameDashboardService.saveGameScore(this.gameId, this.score.toString())
    }
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

  // Get tile color based on value
  getTileColor(value: number): string {
    const colors: { [key: number]: string } = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    return colors[value] || 'transparent';
  }

  // Get tile font size based on value
  getTileFontSize(value: number): string {
    if (value < 100) return '1.5em';
    if (value < 1000) return '1.2em';
    return '1em';
  }

  checkWinner() {}
}
