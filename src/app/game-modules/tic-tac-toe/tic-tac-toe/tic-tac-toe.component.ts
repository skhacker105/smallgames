import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { MatDialog } from '@angular/material/dialog';
import { generateHexId } from '../../../utils/support.utils';
import { Observable } from 'rxjs';
import { IGameMultiPlayerConnection, IPlayer } from '../../../interfaces';

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

  constructor(gameDashboardService: GameDashboardService,
    multiPlayerService: MultiPlayerService, dialog: MatDialog) {
    super(gameDashboardService, multiPlayerService, dialog);
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
  }

  getGameState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winnerResult: this.winnerResult,
      gameId: this.gameId
    };
  }

  setGameState(savedState: any): void {
    this.board = savedState.board;
      this.currentPlayer = savedState.currentPlayer;
      this.winnerResult = savedState.winnerResult;
      this.gameId = savedState.gameId ?? generateHexId(16);
  }

  loadGameState(): void {
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.setGameState(savedState);
    }
  }

  saveGameState(): void {
    this.gameDashboardService.saveGameState(this.getGameState(), (this.gameInfo?.key ?? undefined));
  }

  makeMove(row: number, col: number): void {
    if (!this.board[row][col] && !this.winnerResult) {
      this.board[row][col] = this.currentPlayer;
      const winnerResult = this.checkWinner();
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
    this.gameId = generateHexId(16);
    this.board = Array(3).fill(null).map(() => Array(3).fill(''));
    this.currentPlayer = 'X';
    this.winnerResult = undefined;
    this.saveGameState();
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

  isWinnerCell(row: number, col: number, cell: PlayerType): boolean {
    return cell === this.winnerResult?.winner
      && this.winnerResult.positions.some(position => position.row === row && position.col === col)
  }
}
