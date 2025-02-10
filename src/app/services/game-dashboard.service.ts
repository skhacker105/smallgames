import { Injectable } from '@angular/core';
import { IGameInfo, IGameWinner, IPlayer, ISocketMessage, IUser, IYesNoConfig } from '../interfaces';
import { BehaviorSubject, Observable, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { YesNoDialogComponent } from '../components/yes-no-dialog/yes-no-dialog.component';
import { SocketService } from './socket.service';
import { MatDialog } from '@angular/material/dialog';
import { LoggerService } from './logger.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class GameDashboardService {

  games: IGameInfo[] = [
    {
      key: 'tictactoe',
      name: 'Tic Tac Toe',
      image: 'assets/tictactoe_icon.png',
      route: 'tictactoe',
      settingsIconNeeded: false
    },
    {
      key: 'snakes',
      name: 'Snakes',
      image: 'assets/snakes_icon.png',
      route: 'snakes',
      settingsIconNeeded: false
    },
    {
      key: 'sudoku',
      name: 'Sudoku',
      image: 'assets/sudoku_icon.png',
      route: 'sudoku',
      settingsIconNeeded: false
    },
    {
      key: 'snakeNLadder',
      name: 'Snake N Ladder',
      image: 'assets/snakenladder_icon.png',
      route: 'snakeNLadder',
      settingsIconNeeded: false
    },
    {
      key: 'ludo',
      name: 'Ludo',
      image: 'assets/ludo_icon.png',
      route: 'ludo',
      settingsIconNeeded: false
    },
    {
      key: 'chess',
      name: 'Chess',
      image: 'assets/chess_icon.png',
      route: 'chess',
      settingsIconNeeded: false
    }
  ];
  gameRequestWaitTime = 30; // in seconds
  allWinnersKey = 'allWinner';

  selectedGame = new BehaviorSubject<IGameInfo | undefined>(undefined);

  // Incoming Requests bifercated by type
  public incomingGameRequest$: Observable<ISocketMessage | null>;
  public incomingGameRequestResponse$: Observable<ISocketMessage | null>;
  public incomingGameRequestCancel$: Observable<ISocketMessage | null>;

  constructor(
    private router: Router,
    private socketService: SocketService,
    private dialog: MatDialog,
    private loggerService: LoggerService,
    private userService: UserService) {

    this.incomingGameRequest$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'pending'));
    this.incomingGameRequestResponse$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && (message.gameRequestStatus === 'accepted' || message.gameRequestStatus === 'rejected')));
    this.incomingGameRequestCancel$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'requestCancel'));

    this.selectedGame.subscribe({
      next: gameInfo => {
        if (gameInfo) this.router.navigateByUrl(gameInfo.route);
        else this.router.navigateByUrl('');
      }
    });
    this.hanldeIncomingGameRequest();
    this.handleIncomingCancelGameRequest();
  }

  saveGameState(state: any): void {
    if (!this.selectedGame.value) return;

    localStorage.setItem(this.selectedGame.value.key, JSON.stringify(state));
  }

  loadGameState(): any {
    if (!this.selectedGame.value) return null;

    const state = localStorage.getItem(this.selectedGame.value.key);
    return state ? JSON.parse(state) : null;
  }

  saveGameWinner(winnerPlayer: IPlayer | IPlayer[], isDraw: boolean = false): void {
    if (!this.selectedGame.value) return;

    const allSavedWinners = this.getAllWinners();
    allSavedWinners.push({
      key: this.selectedGame.value?.key,
      winner: !Array.isArray(winnerPlayer) ? winnerPlayer : undefined,
      winners: Array.isArray(winnerPlayer) ? winnerPlayer : undefined,
      isDraw
    });
    localStorage.setItem(this.allWinnersKey, JSON.stringify(allSavedWinners));
  }

  getAllWinners(): IGameWinner[] {
    const savedWInners = localStorage.getItem(this.allWinnersKey);
    if (!savedWInners) return [] as IGameWinner[];

    return JSON.parse(savedWInners);
  }

  hanldeIncomingGameRequest(): void {
    this.incomingGameRequest$
      .subscribe(gameRequest => {
        if (!gameRequest) return;

        const gameInfo = this.games.find(g => g.key === gameRequest.gameKey);
        if (!gameInfo) {
          this.loggerService.log('No game found for the game request');
          return;
        }

        const yesNoConfig: IYesNoConfig = {
          title: 'New Game Request',
          message: `${gameRequest.sourceUserName} requested you to join ${gameInfo.name}.`,
          countDown: this.gameRequestWaitTime,
          noButtonText: 'Cancel',
          yesButtonText: 'Join'
        };
        gameInfo.incomingRequest = this.dialog.open(YesNoDialogComponent, {
          data: yesNoConfig
        });
        gameInfo.incomingRequest.afterClosed().pipe(take(1))
          .subscribe(confirm => {
            this.sendGameRequestResponse(gameInfo, { userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName }, confirm)
            gameInfo.incomingRequest = undefined;
          });
      });
  }

  handleIncomingCancelGameRequest(): void {
    this.incomingGameRequestCancel$
      .subscribe(cancelRequest => {
        if (!cancelRequest) return;

        const gameInfo = this.games.find(g => g.key === cancelRequest.gameKey);
        if (!gameInfo) {
          this.loggerService.log('No game found for the game cancel request');
          return;
        }
        gameInfo.incomingRequest?.close();
      });
  }

  sendGameRequest(gameInfo: IGameInfo, player: IPlayer) {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }
    if (!player.userId) {
      this.loggerService.log('Player is a local user');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date,
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'pending'
    };

    this.socketService.sendMessage(player.userId, message);
  }

  sendGameCancelRequest(gameInfo: IGameInfo, player: IPlayer) {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }
    if (!player.userId) {
      this.loggerService.log('Player is a local user');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date,
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'requestCancel'
    };
    this.socketService.sendMessage(player.userId, message);
  }

  sendGameRequestResponse(gameInfo: IGameInfo, source: IUser, response: boolean) {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date,
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: response ? 'accepted' : 'rejected'
    };
    this.socketService.sendMessage(source.userId, message);
  }
}
