import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pattern-puzzle',
  templateUrl: './pattern-puzzle.component.html',
  styleUrl: './pattern-puzzle.component.scss'
})
export class PatternPuzzleComponent implements OnInit {
  board: number[][] = []; // Represents the puzzle board
  emptyPosition: { row: number, col: number } = { row: -1, col: -1 }; // Position of the empty space
  gridSize: number = 4; // 4x4 grid
  isGameOver: boolean = false;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.initializeGame();
  }

  // Initialize the game
  initializeGame(): void {
    this.board = this.createPuzzleBoard();
    this.shuffleBoard();
    this.isGameOver = false;
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
      this.moveTile(randomMove.row, randomMove.col);
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
  moveTile(row: number, col: number): void {
    if (this.isValidMove(row, col)) {
      const { row: emptyRow, col: emptyCol } = this.emptyPosition;
      this.board[emptyRow][emptyCol] = this.board[row][col];
      this.board[row][col] = 0;
      this.emptyPosition = { row, col };
      this.checkGameOver();
    }
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
  }

  // Reset the game
  resetGame(): void {
    this.initializeGame();
  }
}
