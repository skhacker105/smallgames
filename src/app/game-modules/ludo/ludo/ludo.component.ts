import { Component } from '@angular/core';
import { ILudoCoin, IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { BaseComponent } from '../../../components/base.component';
import { COLOR_PATHS, LUDO_PATHS } from '../ludo-path';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { ALL_COLORS } from '../../../config';

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
  colors = ALL_COLORS;

  playableCoins = new Set<number>();
  coinsToReverse: ILudoCoin[] = [];

  paths = LUDO_PATHS;

  get player(): IPlayer {
    return this.players[this.currentPlayer]
  }

  constructor(private gameDashboardService: GameDashboardService, private dialog: MatDialog, private router: Router) {
    super();
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
      this.playerColors = savedState.playerColors ?? this.colors;
      this.playableCoins = new Set<number>(savedState.playableCoins ?? []);
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
    this.playableCoins.clear();
    this.askForPlayers();
  }

  saveGameState(): void {
    const state = {
      players: this.players,
      currentPlayer: this.currentPlayer,
      lastDiceRoll: this.lastDiceRoll,
      totalDiceRoll: this.totalDiceRoll,
      winner: this.winner,
      playerColors: this.playerColors,
      playableCoins: [...this.playableCoins.values()]
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
      return this.colors;
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
            ludoCoins: Array(4).fill(null).map((v, i) => ({ position: 0, finished: false, id: ((index * 4) + i) + 1 }))
          } as IPlayer));
          this.currentPlayer = 0;
          this.winner = null;
          this.saveGameState();
        }
      })
  }

  getColorPlayer(color: string = 'red'): IPlayer | undefined {
    const colorIndex = this.playerColors.findIndex(pc => pc === color);
    if (colorIndex === -1) return;

    return this.players[colorIndex];
  }

  rollDice(): void {
    if (this.rolling || this.totalDiceRoll) return;

    this.rolling = true;
    this.playableCoins.clear();
    setTimeout(() => {
      this.rolling = false;
      // this.processDiceRoll(Math.floor(Math.random() * 6) + 1);
      this.processDiceRoll(Math.floor(Math.random() * 2) + 5);
      this.saveGameState();
    }, 1000);
  }

  processDiceRoll(diceRoll: number): void {
    this.lastDiceRoll = diceRoll;
    this.totalDiceRoll += diceRoll;

    if (diceRoll === 6 && this.coinsToReverse.length === 2) {
      this.rollbackCoinsMove();
      this.moveToNextPlayer();
    }

    this.identifyPlayableCoins(diceRoll);
    if (this.playableCoins.size === 0) {
      this.rollbackCoinsMove();
      this.moveToNextPlayer();
    }
  }

  rollbackCoinsMove(): void {
    while (this.coinsToReverse.length > 0) {
      const coin = this.coinsToReverse.pop();
      this.players.forEach(player => {
        if (player.ludoCoins) {
          for (let i = 0; i < player.ludoCoins.length; i++) {
            if (coin?.id === player.ludoCoins[i].id) {
              player.ludoCoins[i] = coin;
            }
          }
        }
      });
    }
  }

  identifyPlayableCoins(diceRoll: number): void {
    const playerColorPath = COLOR_PATHS[this.player.color ?? 'red'];

    this.player.ludoCoins?.forEach((coin) => {
      if (coin.finished) return;

      if (coin.position === 0 && diceRoll === 6) {
        this.playableCoins.add(coin.id);
        return;
      }

      if (coin.position === 0) return;


      const coinIndexOnColorPath = playerColorPath.findIndex(path => coin.position === path.cellNumber);
      const colorPathLen = playerColorPath.length;
      const isPathLeftToPlay = (coinIndexOnColorPath + diceRoll) <= colorPathLen;

      if (isPathLeftToPlay)
        this.playableCoins.add(coin.id);
    });
  }

  playCoin(coin: ILudoCoin): void {
    if (!this.playableCoins.has(coin.id)) return;

    if (this.lastDiceRoll === 6)
      this.coinsToReverse.push({ ...coin })
    else
      this.coinsToReverse = [];

    if (this.lastDiceRoll === 6 && coin.position === 0) {
      this.getCoinOutOfBase(coin);
      this.playableCoins.clear();
      this.saveGameState();
    }
    else if (coin.position !== 0) {
      this.moveCoin(coin, this.lastDiceRoll)
        .then(() => {
          if (6 !== this.lastDiceRoll)
            this.moveToNextPlayer();
          else
            this.playableCoins.clear();
          this.saveGameState();
        });
    }
    else this.moveToNextPlayer();
    this.totalDiceRoll = 0;
  }

  getCoinOutOfBase(coin: ILudoCoin): void {
    const curPlayerColor = this.player.color;
    const starPosition = this.paths.find(path => path.color === curPlayerColor && path.isStart);
    if (starPosition) coin.position = starPosition.cellNumber;
  }

  moveCoin(coin: ILudoCoin, movesPending: number): Promise<void> {

    const colorPath = COLOR_PATHS[this.player.color ?? 'red'];

    let pathIndex = colorPath.findIndex(path => path.cellNumber === coin.position);
    if (pathIndex > -1) {

      if (pathIndex === colorPath.length - 1 && movesPending === 1) {
        coin.position = 0;
        coin.finished = true;
        return new Promise(resolve => resolve());
      }

      const newPosition = colorPath[pathIndex + 1];
      coin.position = newPosition.cellNumber;
    }

    return new Promise<void>((resolve, reject) => {
      if (movesPending > 1) {
        setTimeout(() => {

          this.moveCoin(coin, movesPending - 1)
            .then(() => resolve());

        }, 100);
      } else {
        resolve();
      }
    });
  }

  moveToNextPlayer(): void {
    if (this.checkWinner()) return;

    this.totalDiceRoll = 0;
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    this.playableCoins.clear();
    this.saveGameState();
    this.playableCoins.clear();
    this.saveGameState();
  }

  checkWinner(): boolean {
    if (this.player.ludoCoins?.every(coin => coin.finished)) {
      this.winner = this.player.name;
      return true;
    }
    return false;
  }
}
