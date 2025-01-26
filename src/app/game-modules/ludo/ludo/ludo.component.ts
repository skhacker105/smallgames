import { Component } from '@angular/core';
import { IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { BaseComponent } from '../../../components/base.component';
import { LUDO_PATHS } from '../ludo-path';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { take } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ludo',
  templateUrl: './ludo.component.html',
  styleUrl: './ludo.component.scss'
})
export class LudoComponent extends BaseComponent {
  players: IPlayer[] = [];
  playerColors: string[] = [];
  currentPlayer: number = 0;
  lastDiceRoll: number = 1;
  rolling: boolean = false;
  totalDiceRoll: number = 0;
  winner: string | null = null;

  paths = LUDO_PATHS;

  constructor(private gameDashboardService: GameDashboardService, private dialog: MatDialog, private router: Router) {
    super()
  }

  loadGameState(): void {
    // Load game state logic
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.players = savedState.players;
      this.currentPlayer = savedState.currentPlayer;
      this.lastDiceRoll = savedState.lastDiceRoll;
      this.totalDiceRoll = savedState.totalDiceRoll;
      this.winner = savedState.winner;
      this.playerColors = savedState.playerColors
      if (this.winner || this.players.length === 0) {
        this.askForPlayers();
      }
    } else {
      this.askForPlayers();
    }
  }

  resetGame(): void {
    this.currentPlayer = 0;
    this.lastDiceRoll = 1;
    this.rolling = false;
    this.totalDiceRoll = 0;
    this.winner = null;
    this.playerColors = [];
    this.askForPlayers();
  }

  saveGameState(): void {
    const state = {
      players: this.players,
      currentPlayer: this.currentPlayer,
      lastDiceRoll: this.lastDiceRoll,
      totalDiceRoll: this.totalDiceRoll,
      winner: this.winner,
      playerColors: this.playerColors
    };
    this.gameDashboardService.saveGameState(state);
  }

  getPathPosition(cellIndex: number, type: 'col' | 'row' = 'row'): string {
    const row = Math.floor(cellIndex / 15);
    if (type === 'row')
      return (row * 6).toString() + 'vw';
    else
      return ((cellIndex - (row * 15)) * 6).toString() + 'vw';
  }

  getPlayerColors(numPlayers: number): string[] {
    const colors = ['red', 'green', 'yellow', 'blue'];

    // For two players
    if (numPlayers === 2) {
      const pair1 = ['red', 'yellow'];
      const pair2 = ['green', 'blue'];
      const randomPair = Math.random() < 0.5 ? pair1 : pair2;
      return randomPair;
    }

    // For three players
    if (numPlayers === 3) {
      const pair1 = ['red', 'yellow'];
      const pair2 = ['green', 'blue'];
      const randomPair = Math.random() < 0.5 ? pair1 : pair2;
      const remainingColors = randomPair === pair1 ? pair2 : pair1;

      // Select third color from the remaining set
      const thirdColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];

      return [...randomPair, thirdColor];
    }

    // For four players, use all colors
    if (numPlayers === 4) {
      return colors;
    }

    // Return empty array for invalid number of players
    return [];
  }

  askForPlayers(): void {
    const ref = this.dialog.open(PlayersConfigComponent, {
      data: {
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 4,
        preFillPlayers: this.players.length > 0 ? this.players : undefined
      } as IPlayerAskConfig
    })
    ref.afterClosed().pipe(take(1))
      .subscribe((players: IPlayer[] | undefined) => {
        if (!players) {
          if (this.players.length === 0)
            this.router.navigateByUrl('');
        }
        else {
          this.playerColors = this.getPlayerColors(players.length);
          this.players = players.map((player, index) => ({
            name: player.name,
            color: this.playerColors[index],
            ludoCoins: Array(4).fill(null).map(() => ({ position: 0, finished: false }))
          } as IPlayer));
          this.currentPlayer = 0;
          this.winner = null;
          this.saveGameState();
          console.log(this.players)
        }
      })
  }

  getBareAreaPlayer(color: string = 'red'): IPlayer | undefined {
    const colorIndex = this.playerColors.findIndex(pc => pc === color);
    if (colorIndex === -1) return;

    return this.players[colorIndex];
  }

  rollDice(): void {
    if (this.rolling) return;

    this.rolling = true;
    setTimeout(() => {
      this.lastDiceRoll = Math.floor(Math.random() * 6) + 1;
      this.totalDiceRoll += this.lastDiceRoll;
      this.rolling = false;

      if (this.lastDiceRoll < 6) {
        this.moveToNextPlayer();
      }
    }, 1000);
  }

  moveToNextPlayer(): void {
    if (this.checkWinner()) return;

    this.totalDiceRoll = 0;
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
  }

  checkWinner(): boolean {
    const current = this.players[this.currentPlayer];
    if (current.ludoCoins?.every(coin => coin.finished)) {
      this.winner = current.name;
      return true;
    }
    return false;
  }

  moveCoin(coinIndex: number): void {
    const current = this.players[this.currentPlayer];
    if (!current.ludoCoins) return;
    const coin = current.ludoCoins[coinIndex];

    if (coin.finished) return;

    const newPosition = coin.position + this.lastDiceRoll;
    if (newPosition > 56) return;

    coin.position = newPosition;
    if (newPosition === 56) {
      coin.finished = true;
    }

    if (this.lastDiceRoll < 6) {
      this.moveToNextPlayer();
    }
  }
}
