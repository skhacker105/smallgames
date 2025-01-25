import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';

type PlayerType = 'X' | 'O' | '';
type Cuts = 'horizontal' | 'vertical' | 'diagonal_left' | 'diagonal_right'

interface IPosition {
  row: number, col: number;
}

@Component({
  selector: 'app-tic-tac-toe',
  templateUrl: './tic-tac-toe.component.html',
  styleUrl: './tic-tac-toe.component.scss'
})
export class TicTacToeComponent extends BaseComponent {

  board: PlayerType[][];
  currentPlayer: PlayerType;
  winnerResult: { winner: PlayerType, positions: IPosition[], cut: Cuts } | undefined;

  constructor(private gameDashboardService: GameDashboardService) {
    super();
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
  }

  loadGameState(): void {
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.board = savedState.board;
      this.currentPlayer = savedState.currentPlayer;
      this.winnerResult = savedState.winnerResult
    }
  }

  makeMove(row: number, col: number): void {
    if (!this.board[row][col] && !this.winnerResult) {
      this.board[row][col] = this.currentPlayer;
      const winnerResult = this.checkWinner();
      console.log({ winnerResult })
      if (winnerResult) {
        this.winnerResult = { ...winnerResult, winner: this.currentPlayer };
      } else {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      }
      this.saveGameState();
    }
  }

  checkWinner(): { positions: IPosition[], cut: Cuts } | undefined {
    // Check rows, columns, and diagonals

    const winnerCell = (cells: PlayerType[][]): number => {
      for (const [index, line] of cells.entries()) {
        if (line.every(cell => cell === 'X') || line.every(cell => cell === 'O')) {
          return index;
        }
      }
      return -1;
    }


    // Check rows
    let winner = winnerCell(this.board);
    if (winner !== -1) {
      return {
        cut: 'horizontal',
        positions: [0, 1, 2].map(v => ({ row: winner, col: v }) as IPosition)
      };
    }

    // Check columns
    winner = winnerCell([0, 1, 2].map(i => this.board.map(row => row[i])));
    if (winner != -1) {
      return {
        cut: 'vertical',
        positions: [0, 1, 2].map(v => ({ row: v, col: winner }) as IPosition)
      };
    }

    // Check diagonals
    if (winnerCell([[this.board[0][0], this.board[1][1], this.board[2][2]]]) != -1) {
      return {
        cut: 'diagonal_left',
        positions: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }]
      };
    }
    if (winnerCell([[this.board[0][2], this.board[1][1], this.board[2][0]]]) != -1) {
      return {
        cut: 'diagonal_right',
        positions: [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }]
      };
    }

    return;
  }

  resetGame(): void {
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
    this.winnerResult = undefined;
    this.saveGameState();
  }

  saveGameState(): void {
    this.gameDashboardService.saveGameState({
      board: this.board,
      currentPlayer: this.currentPlayer,
      winnerResult: this.winnerResult
    });
  }

  isWinnerCell(row: number, col: number, cell: PlayerType): boolean {
    return cell === this.winnerResult?.winner
      && this.winnerResult.positions.some(position => position.row === row && position.col === col)
  }
}
