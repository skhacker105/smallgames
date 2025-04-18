// snake-ladder.component.ts
import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { IGameMultiPlayerConnection, IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { Observable, map, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { generateHexId } from '../../../utils/support.utils';

export interface IGameBoard {
  name: string;
  background: string;
  ladders: Record<number, number>;
  snakes: Record<number, number>;
}

@Component({
  selector: 'app-snake-nladder',
  templateUrl: './snake-nladder.component.html',
  styleUrls: ['./snake-nladder.component.scss']
})
export class SnakeNLadderComponent extends BaseComponent {

  allBoards: IGameBoard[] = [
    {
      name: 'Board01',
      background: 'assets/snakenladderboard01.jpg',
      ladders: { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 51: 67, 71: 91, 80: 100 },
      snakes: { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 },
    },
    {
      name: 'Board02',
      background: 'assets/snakenladderboard02.jpg',
      ladders: { 5: 35, 9: 51, 23: 42, 48: 86, 62: 83, 69: 91 },
      snakes: { 36: 5, 49: 7, 56: 8, 82: 20, 87: 66, 95: 38 },
    },
    {
      name: 'Board03',
      background: 'assets/snakenladderboard03.jpg',
      ladders: { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 },
      snakes: { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 89: 53, 95: 77, 99: 41 },
    }
  ];
  winner: IPlayer | null = null;
  currentPlayer: number = 0;
  selectedBoard?: IGameBoard;
  board: number[] = Array(100).fill(0);
  playerPositions: number[] = []; // Each player has a single coin
  snakes: Record<number, number> = {};
  ladders: Record<number, number> = {};
  totalDiceRoll: number = 0;
  lastDiceRoll = 1;
  rolling: boolean = false;

  arrNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
    dialog: MatDialog,
    private router: Router,
    private userService: UserService,
    multiPlayerService: MultiPlayerService
  ) {
    super(gameDashboardService, multiPlayerService, dialog);
  }

  isRowLeftToRight(row: number): boolean {
    return row % 2 === 0;
  }

  getGameState(): any {
    return {
      players: this.players,
      board: this.board,
      playerPositions: this.playerPositions,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      snakes: this.snakes,
      ladders: this.ladders,
      selectedBoard: this.selectedBoard,
      lastDiceRoll: this.lastDiceRoll,
      totalDiceRoll: this.totalDiceRoll,
      rolling: this.rolling,
      gameId: this.gameId
    };
  }

  setGameState(savedState: any): void {
    this.players = savedState.players;
    this.board = savedState.board;
    this.playerPositions = savedState.playerPositions;
    this.currentPlayer = savedState.currentPlayer;
    this.winner = savedState.winner;
    this.snakes = savedState.snakes;
    this.ladders = savedState.ladders;
    this.selectedBoard = savedState.selectedBoard;
    this.lastDiceRoll = savedState.lastDiceRoll;
    this.totalDiceRoll = savedState.totalDiceRoll;
    this.rolling = savedState.rolling;
    this.gameId = savedState.gameId ?? generateHexId(16);
  }

  loadGameState(): void {

    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.setGameState(savedState);

      if (this.winner || this.players.length === 0 || this.playerPositions.every(pos => pos === 0)) {
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
          this.totalDiceRoll = 0;
          this.lastDiceRoll = 1;
          this.winner = null;
          this.playerPositions = Array(this.players.length).fill(0);
          this.currentPlayer = 0;
          this.rolling = false;
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

  override getPlayerConfigPopup(): MatDialogRef<PlayersConfigComponent, any> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    return this.dialog.open(PlayersConfigComponent, {
      data: {
        game: curGame,
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 6,
        preFillPlayers: this.players.length > 0 ? this.players : undefined,
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
    this.players = players;
  }
  setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void {
    this.players = multiPlayerGame.players.map(player => player.player);
  }
  setPlayersAndStartGame(): void {
    this.setPlayers()?.subscribe({
      next: players => {

        this.players = players;
        this.playerPositions = Array(players.length).fill(0);
        this.currentPlayer = 0;
        this.winner = null;
        this.generateNewGame();
        this.saveGameState();

        const otherPlayers = this.players.find(p => p.userId !== undefined && p.userId === this.userService.me?.userId) !== undefined;
        if (otherPlayers) {
          this.startMultiPlayerGame();
          this.listenForGameStateChange();
          this.listenForPlayerLeft();
          this.listenForPlayerUpdate()
        }
      }
    });
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

  generateNewGame(): void {
    this.selectedBoard = this.allBoards[Math.floor(Math.random() * this.allBoards.length)];
    this.snakes = this.selectedBoard.snakes //this.generateRandomPositions('snake');
    this.ladders = this.selectedBoard.ladders //this.generateRandomPositions('ladder');
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
    this.sendGameStateUpdate();

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

  async processDiceRoll(diceRoll: number) {
    this.lastDiceRoll = diceRoll;
    if (diceRoll === 6 && this.totalDiceRoll === 12) {
      this.totalDiceRoll = 0;
      this.lastDiceRoll;
      await this.moveCoin();
    } else {
      this.totalDiceRoll += diceRoll;
      if (diceRoll !== 6) await this.moveCoin();
    }
    this.sendGameStateUpdate();
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

          this.gameDashboardService.saveGameWinner(this.players[this.currentPlayer]);
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

  checkWinner(): boolean {
    return this.playerPositions.some((pos, index) => {
      if (pos >= 100) {
        this.winner = this.players[index];
        return true;
      }
      return false;
    });
  }

}

