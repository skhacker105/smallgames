import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';

@Component({
  selector: 'app-tic-tac-toe',
  templateUrl: './tic-tac-toe.component.html',
  styleUrl: './tic-tac-toe.component.scss'
})
export class TicTacToeComponent extends BaseComponent {
  board: string[][];
  currentPlayer: string;
  winner: string | null;

  constructor(private gameDashboardService: GameDashboardService) {
    super();
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
    this.winner = null;
  }

  loadGameState(): void {
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.board = savedState.board;
      this.currentPlayer = savedState.currentPlayer;
      this.winner = savedState.winner;
    }
  }

  makeMove(row: number, col: number): void {
    if (!this.board[row][col] && !this.winner) {
      this.board[row][col] = this.currentPlayer;
      if (this.checkWinner()) {
        this.winner = this.currentPlayer;
      } else {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      }
      this.saveGameState();
    }
  }

  checkWinner(): boolean {
    // Check rows, columns, and diagonals
    const lines = [
      // Rows
      ...this.board,
      // Columns
      [0, 1, 2].map(i => this.board.map(row => row[i])),
      // Diagonals
      [[this.board[0][0], this.board[1][1], this.board[2][2]],
       [this.board[0][2], this.board[1][1], this.board[2][0]]]
    ];

    for (const line of lines) {
      if (line.every(cell => cell === 'X') || line.every(cell => cell === 'O')) {
        return true;
      }
    }
    return false;
  }

  resetGame(): void {
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
    this.winner = null;
    this.saveGameState();
  }

  saveGameState(): void {
    this.gameDashboardService.saveGameState({
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
    });
  }
}
