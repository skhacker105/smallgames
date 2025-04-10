import { Injectable } from '@angular/core';
import { Observable, filter, take } from 'rxjs';
import { IGameInfo, IPlayer, ISocketMessage, IUser, IYesNoConfig } from '../interfaces';
import { SocketService } from './socket.service';
import { MatDialog } from '@angular/material/dialog';
import { LoggerService } from './logger.service';
import { GameDashboardService } from './game-dashboard.service';
import { YesNoDialogComponent } from '../components/yes-no-dialog/yes-no-dialog.component';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class MultiPlayerService {

  
  
  gameRequestWaitTime = 30; // in seconds

  // Incoming Requests bifercated by type
  public incomingGameRequest$: Observable<ISocketMessage | null>;
  public incomingGameRequestResponse$: Observable<ISocketMessage | null>;
  public incomingGameRequestCancel$: Observable<ISocketMessage | null>;
  public incomingGamePlayerUpdate$: Observable<ISocketMessage | null>;
  public incomingGameStart$: Observable<ISocketMessage | null>;
  public incomingGameStateChanged$: Observable<ISocketMessage | null>;

  constructor(
    private socketService: SocketService,
    private dialog: MatDialog,
    private loggerService: LoggerService,
    private gameDashboardService: GameDashboardService,
    private userService: UserService
  ) {
    this.incomingGameRequest$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'pending'));
    this.incomingGameRequestResponse$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && (message.gameRequestStatus === 'accepted' || message.gameRequestStatus === 'rejected')));
    this.incomingGameRequestCancel$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'requestCancel'));
    this.incomingGamePlayerUpdate$ = this.socketService.message$.pipe(filter(message => message?.type === 'gamePlayerUpdate'));
    this.incomingGameStart$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'gameStart'));
    this.incomingGameStateChanged$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameState'));

    this.hanldeIncomingGameRequest();
    this.handleIncomingCancelGameRequest();
  }

  hanldeIncomingGameRequest(): void {
    this.incomingGameRequest$
      .subscribe(gameRequest => {
        if (!gameRequest) return;

        const gameInfo = this.gameDashboardService.games.find(g => g.key === gameRequest.gameKey);
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
        gameInfo.incomingRequestConfirmationDialogRef = this.dialog.open(YesNoDialogComponent, {
          data: yesNoConfig
        });
        gameInfo.incomingRequestConfirmationDialogRef.afterClosed().pipe(take(1))
          .subscribe(confirm => {
            gameInfo.incomingRequestConfirmationDialogRef = undefined;
            if (confirm === undefined) return;

            this.sendGameRequestResponse(gameInfo, { userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName }, confirm);
            if (confirm === false) return;

            gameInfo.gameOwner = {
              userId: gameRequest.sourceUserId,
              userName: gameRequest.sourceUserName
            };
            gameInfo.isGameStart = true;
            this.gameDashboardService.selectedGame.next(gameInfo);
            this.userService.addNewUserConnection({ userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName });
          });
      });
  }

  handleIncomingCancelGameRequest(): void {
    this.incomingGameRequestCancel$
      .subscribe(cancelRequest => {
        if (!cancelRequest) return;

        const gameInfo = this.gameDashboardService.games.find(g => g.key === cancelRequest.gameKey);
        if (!gameInfo) {
          this.loggerService.log('No game found for the game cancel request');
          return;
        }
        gameInfo.incomingRequestConfirmationDialogRef?.close();
      });
  }

  createGameRequest(gameInfo: IGameInfo) {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'pending'
    };
  }

  sendGameRequest(gameInfo: IGameInfo, player: IPlayer): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }
    if (!player.userId) {
      this.loggerService.log('Player is a local user');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'pending'
    };

    this.socketService.sendMessage(player.userId, message);
  }

  sendGameCancelRequest(gameInfo: IGameInfo, player: IPlayer): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }
    if (!player.userId) {
      this.loggerService.log('Player is a local user');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'requestCancel'
    };
    this.socketService.sendMessage(player.userId, message);
  }

  sendGameRequestResponse(gameInfo: IGameInfo, source: IUser, response: boolean): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: response ? 'accepted' : 'rejected'
    };
    this.socketService.sendMessage(source.userId, message);
  }

  sendGamePlayerUpdate(gameInfo: IGameInfo, players: IPlayer[]): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gamePlayerUpdate',
      gameKey: gameInfo.key,
      gamePlayerUpdate: players
    };
    // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
    this.sendMessagesToPlayer(players, message);
  }

  sendGameStartRequest(gameInfo: IGameInfo, players: IPlayer[], gameState: any): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'gameStart',
      gameState
    };
    // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
    this.sendMessagesToPlayer(players, message);
  }

  sendGameStateUpdate(gameInfo: IGameInfo, players: IPlayer[], gameState: any): void {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameState',
      gameKey: gameInfo.key,
      gameState
    };
    // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
    this.sendMessagesToPlayer(players, message);
  }

  sendMessagesToPlayer(players: IPlayer[], message: ISocketMessage) {
    players.forEach(p => p.userId && p.userId !== this.userService.me?.userId ? this.socketService.sendMessage(p.userId, message) : null);
  }
}
