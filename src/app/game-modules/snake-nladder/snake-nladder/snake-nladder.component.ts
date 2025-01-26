// snake-ladder.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { MatDialog } from '@angular/material/dialog';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { take } from 'rxjs';
import { Router } from '@angular/router';

export interface IGameBoard {
  name: string;
  background: string;
  ladders: Record<number, number>;
  snakes: Record<number, number>;
  playerColor: string;
  playerBackgroundColor: string;
}

@Component({
  selector: 'app-snake-nladder',
  templateUrl: './snake-nladder.component.html',
  styleUrls: ['./snake-nladder.component.scss']
})
export class SnakeNLadderComponent extends BaseComponent implements OnInit, OnDestroy {

  allBoards: IGameBoard[] = [
    {
      name: 'Board01',
      background: 'assets/snakenladderboard01.jpg',
      ladders: { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 51: 67, 71: 91, 80: 100 },
      snakes: { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 },
      playerColor: 'black',
      playerBackgroundColor: '#ffeb3b'
    },
    {
      name: 'Board02',
      background: 'assets/snakenladderboard02.jpg',
      ladders: { 5: 35, 9: 51, 23: 42, 48: 86, 62: 83, 69: 91 },
      snakes: { 36: 5, 49: 7, 56: 8, 82: 20, 87: 66, 95: 38 },
      playerColor: 'white',
      playerBackgroundColor: '#700022'
    },
    {
      name: 'Board03',
      background: 'assets/snakenladderboard03.jpg',
      ladders: { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 },
      snakes: { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 89: 53, 95: 77, 99: 41 },
      playerColor: 'black',
      playerBackgroundColor: '#ffeb3b'
    }
  ];
  selectedBoard?: IGameBoard;
  players: IPlayer[] = [];
  board: number[] = Array(100).fill(0);
  playerPositions: number[] = []; // Each player has a single coin
  currentPlayer: number = 0;
  winner: IPlayer | null = null;
  snakes: Record<number, number> = {};
  ladders: Record<number, number> = {};
  totalDiceRoll: number = 0;
  lastDiceRoll = 1;
  rolling: boolean = false;

  // arrReverseNumbers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  arrNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(private gameDashboardService: GameDashboardService, private dialog: MatDialog, private router: Router) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  isRowLeftToRight(row: number): boolean {
    return row % 2 === 0;
  }

  loadGameState(): void {
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.players = savedState.players;
      this.board = savedState.board;
      this.playerPositions = savedState.playerPositions;
      this.currentPlayer = savedState.currentPlayer;
      this.winner = savedState.winner;
      this.snakes = savedState.snakes;
      this.ladders = savedState.ladders;
      this.selectedBoard = savedState.selectedBoard
      if (this.winner || this.players.length === 0 || this.playerPositions.every(pos => pos === 0)) {
        this.askForPlayers();
        this.restartGame();
      }
    } else {
      this.askForPlayers();
      this.restartGame();
    }
  }

  saveGameState(): void {
    const state = {
      players: this.players,
      board: this.board,
      playerPositions: this.playerPositions,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      snakes: this.snakes,
      ladders: this.ladders,
      selectedBoard: this.selectedBoard
    };
    this.gameDashboardService.saveGameState(state);
  }

  checkWinner(): boolean {
    return this.playerPositions.some((pos, index) => {
      if (pos >= 100) {
        this.winner = this.players[index];
        return true;
      }
      return false;
    });
  }

  restartGame(): void {
    this.resetGame();
    this.generateNewGame();
  }

  resetGame(): void {
    this.totalDiceRoll = 0;
    this.lastDiceRoll = 1;
    this.winner = null;
    this.playerPositions = Array(this.players.length).fill(0);
    this.currentPlayer = 0;
    this.rolling = false;
    this.saveGameState();
  }

  askForPlayers(): void {
    const ref = this.dialog.open(PlayersConfigComponent, {
      data: {
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 6,
        preFillPlayers: this.players.length > 0 ? this.players : undefined
      } as IPlayerAskConfig
    })
    ref.afterClosed().pipe(take(1))
      .subscribe((players: IPlayer[] | undefined) => {
        if (!players) {
          if (this.playerPositions.every(position => position === 0))
            this.router.navigateByUrl('');
        }
        else {
          this.players = players;
          this.playerPositions = Array(players.length).fill(0);
          this.currentPlayer = 0;
          this.winner = null;
          this.saveGameState();
        }
      })
  }

  generateNewGame(): void {
    this.selectedBoard = this.allBoards[Math.floor(Math.random() * this.allBoards.length)];
    this.snakes = this.selectedBoard.snakes //this.generateRandomPositions('snake');
    this.ladders = this.selectedBoard.ladders //this.generateRandomPositions('ladder');
    this.saveGameState();
  }

  generateRandomPositions(type: 'snake' | 'ladder'): Record<number, number> {
    const positions: Record<number, number> = {};
    const count = 5; // Number of snakes/ladders to generate

    for (let i = 0; i < count; i++) {
      let start, end;

      do {
        start = Math.floor(Math.random() * 90) + 10; // Random number between 10 and 99
        end = Math.floor(Math.random() * 90) + 10;
      } while ((type === 'ladder' && start >= end) || (type === 'snake' && start <= end));

      positions[start] = end;
    }

    return positions;
  }

  rollDice(): void {
    this.animatetotalDiceRoll();
  }

  animatetotalDiceRoll(): void {
    this.rolling = true;

    const rollDice = (iteration: number, appendPreviousRoll: boolean = false): void => {
      if (iteration >= 10) {
        this.rolling = false;
        this.processDiceRoll(Math.floor(Math.random() * 6) + 1)
        return;
      }
      setTimeout(() => rollDice(iteration + 1), 100);
    };

    rollDice(0);
  }

  processDiceRoll(diceRoll: number): void {
    this.lastDiceRoll = diceRoll;
    if (diceRoll === 6 && this.totalDiceRoll === 12) {
      this.totalDiceRoll = 0;
      this.lastDiceRoll;
      this.moveCoin();
    } else {
      this.totalDiceRoll += diceRoll;
      if (diceRoll !== 6) this.moveCoin();
    }
  }


  async moveCoin(): Promise<void> {
    if (this.totalDiceRoll > 0) {
      let newPosition = this.playerPositions[this.currentPlayer] + this.totalDiceRoll;
      const oldPosition = this.playerPositions[this.currentPlayer];

      if (newPosition <= 100) {

        this.playerPositions[this.currentPlayer] = Math.min(newPosition, 100);
        await this.pause(500);

        if (newPosition in this.snakes) {
          this.playerPositions[this.currentPlayer] = this.snakes[newPosition];
          await this.pause(500);
        } else if (newPosition in this.ladders) {
          this.playerPositions[this.currentPlayer] = this.ladders[newPosition];
          await this.pause(500);
        }

        if (this.checkWinner()) {
          this.saveGameState();
          return;
        }
      }

      this.totalDiceRoll = 0;
    }
    if (this.lastDiceRoll !== 6 || this.totalDiceRoll === 0)
      this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    this.saveGameState();
  }

  pause(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

