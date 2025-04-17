import { Component } from '@angular/core';
import { IGameInfo, IGameMultiPlayerConnection, ILudoCoin, IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { BaseComponent } from '../../../components/base.component';
import { COLOR_PATHS, LUDO_PATHS } from '../ludo-path';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { Observable, map, pipe, take, takeUntil, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LUDO_COLORS } from '../../../config';
import { generateHexId, isLudoColor } from '../../../utils/support.utils';
import { UserService } from '../../../services/user.service';
import { MultiPlayerService } from '../../../services/multi-player.service';

@Component({
  selector: 'app-ludo',
  templateUrl: './ludo.component.html',
  styleUrl: './ludo.component.scss'
})
export class LudoComponent extends BaseComponent {

  playerColors: string[] = [];
  currentPlayer: number = 0;
  lastDiceRoll: number = 1;
  rolling: boolean = false;
  totalDiceRoll: number = 0;
  winner: string | null = null;
  colors = LUDO_COLORS;

  playableCoins = new Set<number>();
  coinsToReverse: ILudoCoin[] = [];
  continuousSixes = 0;

  paths = LUDO_PATHS;

  get player(): IPlayer {
    return this.players[this.currentPlayer]
  }

  get noCoinsMoved(): boolean {
    return this.players.every(player => (player.ludoCoins ?? []).every(ludoCoin => ludoCoin.position === 0 && !ludoCoin.finished))
  }

  get isMyTurn(): boolean {
    const me = this.userService.me;
    const hasOtherPlayers = this.players.some(p => p.userId != undefined && p.userId != me?.userId);

    if (hasOtherPlayers) {
      const myPlayerIndex = this.players.findIndex(p => p.userId === me?.userId);
      return myPlayerIndex === this.currentPlayer;
    } else return true;
  }

  override get selectedPlayer(): IPlayer | undefined {
    return this.players[this.currentPlayer]
  }

  constructor(
    gameDashboardService: GameDashboardService,
    dialog: MatDialog, private router: Router,
    public userService: UserService,
    multiPlayerService: MultiPlayerService
  ) {
    super(gameDashboardService, multiPlayerService, dialog);
  }

  getGameState() {
    return {
      players: this.players,
      currentPlayer: this.currentPlayer,
      lastDiceRoll: this.lastDiceRoll,
      totalDiceRoll: this.totalDiceRoll,
      winner: this.winner,
      playerColors: this.playerColors,
      playableCoins: [...this.playableCoins.values()],
      rolling: this.rolling,
      gameId: this.gameId
    };
  }

  setGameState(savedState: any): void {
    this.players = savedState.players;
    this.currentPlayer = savedState.currentPlayer;
    this.lastDiceRoll = savedState.lastDiceRoll;
    this.totalDiceRoll = savedState.totalDiceRoll;
    this.winner = savedState.winner;
    this.playerColors = savedState.playerColors ?? this.colors;
    this.playableCoins = new Set<number>(savedState.playableCoins ?? []);
    this.rolling = savedState.rolling;
    this.gameId = savedState.gameId ?? generateHexId(16);
  }

  loadGameState(): void {

    // Load game state logic
    const savedState = this.gameDashboardService.loadGameState();

    if (savedState) {
      this.setGameState(savedState);

      if (this.winner || this.players.length === 0 || this.noCoinsMoved) {
        this.setPlayersAndStartGame();

      } else if (this.isMultiPlayerGame) {
        this.listenForGameStateChange();
      }


    } else {
      this.setPlayersAndStartGame();
    }
  }

  saveGameState(): void {
    const state = this.getGameState();
    this.gameDashboardService.saveGameState(state, (this.gameInfo?.key ?? undefined));

    const mpg = this.multiPlayerService.getMultiPlayerGame(this.gameInfo?.key ?? '');
    if (mpg) mpg.gameState = state;
    this.multiPlayerService.saveMultiPlayersToStorage();
  }

  resetGame(): void {
    this.askToConfirmResetGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm) return;

          this.gameId = generateHexId(16);
          this.currentPlayer = 0;
          this.lastDiceRoll = 1;
          this.rolling = false;
          this.totalDiceRoll = 0;
          this.winner = null;
          this.players.forEach(player => {
            player.ludoCoins?.forEach(coin => {
              coin.position = 0;
              coin.finished = false;
            })
          })
          this.playableCoins.clear();
          this.saveGameState();
          this.sendGameStateUpdate();
        }
      });

  }

  cancelGame(): void {
    this.askToConfirmCancelGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm || !this.gameDashboardService.selectedGame.value) return;

          this.multiPlayerService.cancelMultiPlayerGame(this.gameId, this.gameDashboardService.selectedGame.value, 'Game owner cancelled this game');
          if (this.gameDashboardService.selectedGame.value)
            this.multiPlayerService.removeGameAndGotoHomePage(this.gameDashboardService.selectedGame.value.key, this.gameId);
        }
      });
  }

  leaveGame(): void {
    this.askToConfirmLeaveGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm || !this.mpg) return;

          this.players = [];
          this.multiPlayerService.sendLeaveGameMessage(this.gameId, this.mpg, this.mpg.gameOwner.userId);
          if (this.gameDashboardService.selectedGame.value)
            this.multiPlayerService.removeGameAndGotoHomePage(this.gameDashboardService.selectedGame.value.key, this.gameId);

        }
      });
  }

  getPathPosition(cellIndex: number, type: 'col' | 'row' = 'row'): string {
    const row = Math.floor(cellIndex / 15);
    if (type === 'row')
      return (row * 6).toString() + 'vw';
    else
      return ((cellIndex - (row * 15)) * 6).toString() + 'vw';
  }

  override getPlayerConfigPopup(): MatDialogRef<PlayersConfigComponent, any> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    return this.dialog.open(PlayersConfigComponent, {
      data: {
        game: curGame,
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 4,
        preFillPlayers: this.players.length > 0 ? this.players : undefined,
        colorOptions: LUDO_COLORS,
        gameId: this.gameId
      } as IPlayerAskConfig,
      disableClose: true
    })
  }

  setPlayers(): Observable<IPlayer[]> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    const ref = this.getPlayerConfigPopup();

    return ref?.afterClosed().pipe(
      take(1), takeUntil(this.isComponentActive),
      map((players: IPlayer[] | IGameMultiPlayerConnection | undefined) => {

        if (!players) {
          if (this.players.length === 0)
            this.router.navigateByUrl('');
        }
        else {

          if (Array.isArray(players)) this.setLocalPlayers(players);
          else this.setOnlinePlayers(players);
        }

        return this.players;
      })
    )
  }
  setLocalPlayers(players: IPlayer[]): void {
    this.playerColors = players.map(player => player.color ?? 'red');

    this.players = players.map((player, index) => ({
      name: player.name,
      color: player.color ?? this.playerColors[index],
      ludoCoins: Array(4).fill(null).map((v, i) => ({ position: 0, finished: false, id: ((index * 4) + i) + 1 })),
      userId: player.userId
    } as IPlayer));
  }
  setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void {
    this.playerColors = multiPlayerGame.players.map(player => player.player.color ?? 'red');

    this.players = multiPlayerGame.players.map((player, index) => {
      return {
        name: player.player.name,
        color: player.player.color ?? this.playerColors[index],
        ludoCoins: Array(4).fill(null).map((v, i) => ({ position: 0, finished: false, id: ((index * 4) + i) + 1 })),
        userId: player.player.userId
      } as IPlayer
    });

  }

  // This function will only run for Game Owner
  setPlayersAndStartGame(): void {
    this.setPlayers()?.subscribe({
      next: players => {

        this.currentPlayer = 0;
        this.winner = null;
        this.saveGameState();

        const otherPlayers = this.players.find(p => p.userId !== undefined && p.userId === this.userService.me?.userId) !== undefined;
        if (otherPlayers) {
          this.startMultiPlayerGame();
          this.listenForGameStateChange();
          this.listenForPlayerLeft();
          this.listenForPlayerUpdate()
        }
      }
    })
  }
  startMultiPlayerGame(): void {
    if (!this.gameDashboardService.selectedGame.value) return;

    this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key)
    if (!this.mpg) return;

    this.mpg.gameState = this.getGameState();
    this.mpg.gamePlayState = 'gameInProgress';

    // Send Game start signal to all players
    this.players.forEach(player => {
      if (player.userId && this.gameDashboardService.selectedGame.value && this.mpg) {
        this.multiPlayerService.sendGameStart(this.gameId, this.mpg, player.userId)
      }
    });
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
    this.sendGameStateUpdate();

    setTimeout(() => {
      this.rolling = false;
      this.processDiceRoll(Math.floor(Math.random() * 6) + 1);
      this.saveGameState();
    }, 1000);
  }

  processDiceRoll(diceRoll: number): void {
    this.lastDiceRoll = diceRoll;
    this.totalDiceRoll += diceRoll;

    if (diceRoll === 6 && this.continuousSixes === 2) {
      this.rollbackCoinsMove();
      this.moveToNextPlayer();
    }

    this.identifyPlayableCoins(diceRoll);
    if (this.playableCoins.size === 0) {
      this.rollbackCoinsMove();
      this.moveToNextPlayer();
    }
    this.sendGameStateUpdate();
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
    if (!isLudoColor(this.player.color)) return;

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
    if (!this.playableCoins.has(coin.id) || !this.isMyTurn) return;

    if (this.lastDiceRoll === 6) {
      this.coinsToReverse.push({ ...coin });
      this.continuousSixes++;
    }
    else {
      this.coinsToReverse = [];
      this.continuousSixes = 0;
    }

    if (this.lastDiceRoll === 6 && coin.position === 0) {
      this.getCoinOutOfBase(coin);
      this.playableCoins.clear();
      this.saveGameState();
      this.sendGameStateUpdate();
      if (this.checkWinner()) return;
    }
    else if (coin.position !== 0) {
      this.moveCoin(coin, this.lastDiceRoll)
        .then(() => {

          const otherCoins = this.otherPlayerCoinsAtDestination(coin);
          if (otherCoins.length > 0) {
            otherCoins[0].position = 0;
            this.coinsToReverse.push({ ...otherCoins[0] });
          }

          if (6 !== this.lastDiceRoll && otherCoins.length === 0 && !coin.finished)
            this.moveToNextPlayer();
          else
            this.playableCoins.clear();

          this.saveGameState();
          this.sendGameStateUpdate();
          if (this.checkWinner()) return;
          
        });
    }
    else this.moveToNextPlayer();
    this.totalDiceRoll = 0;
  }

  otherPlayerCoinsAtDestination(coin: ILudoCoin): ILudoCoin[] {
    const coinsFound: ILudoCoin[] = [];
    this.players.forEach(player => {
      if (player.name === this.player.name) return;

      if (player.ludoCoins) {
        player.ludoCoins.forEach(ludoCoin => {
          if (ludoCoin.finished) return;
          const isCellSafe = this.paths.find(path => path.cellNumber === coin.position)?.isSafe
          if (ludoCoin.position === coin.position && !isCellSafe) {
            coinsFound.push(ludoCoin);
          }
        });
      }
    });
    return coinsFound;
  }

  getCoinOutOfBase(coin: ILudoCoin): void {
    const curPlayerColor = this.player.color;
    const starPosition = this.paths.find(path => path.color === curPlayerColor && path.isStart);
    if (starPosition) coin.position = starPosition.cellNumber;
  }

  moveCoin(coin: ILudoCoin, movesPending: number): Promise<void> {
    if (!isLudoColor(this.player.color)) return new Promise(resolve => resolve());

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
  }

  checkWinner(): boolean {
    if (this.player.ludoCoins?.every(coin => coin.finished)) {
      this.winner = this.player.name;
      this.gameDashboardService.saveGameWinner(this.player);
      return true;
    }
    return false;
  }
}
