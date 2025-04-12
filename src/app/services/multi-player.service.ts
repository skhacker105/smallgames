import { Injectable } from '@angular/core';
import { Observable, filter, take } from 'rxjs';
import { IGameInfo, IGameMultiPlayerConnection, IGameRemotePlayer, IPlayer, ISocketMessage, IUser, IYesNoConfig } from '../interfaces';
import { SocketService } from './socket.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoggerService } from './logger.service';
import { GameDashboardService } from './game-dashboard.service';
import { YesNoDialogComponent } from '../components/yes-no-dialog/yes-no-dialog.component';
import { UserService } from './user.service';
import { GamePlayState, GameRequestStatus } from '../types';

@Injectable({
  providedIn: 'root'
})
export class MultiPlayerService {

  gameRequestWaitTime = 30; // in seconds
  multiPlayerGames: IGameMultiPlayerConnection[] = [];

  // Incoming Requests bifercated by type
  public incomingGameRequest$: Observable<ISocketMessage | null>;
  public incomingGameRequestResponse$: Observable<ISocketMessage | null>;

  public incomingGameRequestCancel$: Observable<ISocketMessage | null>;
  public incomingGameLeft$: Observable<ISocketMessage | null>;
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
    this.incomingGameLeft$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'leftGame'));
    this.incomingGamePlayerUpdate$ = this.socketService.message$.pipe(filter(message => message?.type === 'gamePlayerUpdate'));
    this.incomingGameStart$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'gameStart'));
    this.incomingGameStateChanged$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameState'));

    this.hanldeIncomingGameRequest();
    // this.handleIncomingCancelGameRequest();
  }

  anyGameInProgressStatus(gameKey: string): boolean {
    const multiPGame = this.multiPlayerGames.find(game => game.gameInfo.key === gameKey);
    if (!multiPGame) return false;

    return ['gameEnd', 'gameCancel'].indexOf((multiPGame?.gamePlayState, '')) < 0;
  }


  // Start Game
  startMultiPlayerGame(gameInfo: IGameInfo, players: IPlayer[], gameOwner?: IUser): IGameMultiPlayerConnection | undefined {
    if (this.anyGameInProgressStatus(gameInfo.key) || !this.userService.me) return;

    const gameRemotePlayers = players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.userId || !this.userService.me || player.userId === this.userService.me.userId) return arr;

      const connectionSocketMessage = !gameOwner
        ? this.sendGameRequest(gameInfo, player.userId, players)
        : this.sendGameRequestResponse(gameInfo, player.userId, 'accepted');

      if (connectionSocketMessage)
        arr.push({
          player,
          connectionStatus: !gameOwner ? 'pending' : 'accepted',
          connectionSocketMessage,
          hasUser: !!player.userId,
          isMe: player.userId && player.userId === this.userService.me?.userId ? true : false
        });
      return arr;
    }, [] as IGameRemotePlayer[]);

    const newMultiPlayerGame: IGameMultiPlayerConnection = {
      gameInfo,
      gameOwner: gameOwner ?? this.userService.me,
      gamePlayState: 'playerSetting',
      players: gameRemotePlayers,
      gameState: undefined,
      gameStateHistory: []
    };
    this.multiPlayerGames.push(newMultiPlayerGame);
    return newMultiPlayerGame;

  }

  // handleIncomingCancelGameRequest(): void {
  //   this.incomingGameRequestCancel$
  //     .subscribe(cancelRequest => {
  //       if (!cancelRequest) return;

  //       const gameInfo = this.gameDashboardService.games.find(g => g.key === cancelRequest.gameKey);
  //       if (!gameInfo) {
  //         this.loggerService.log('No game found for the game cancel request');
  //         return;
  //       }
  //       gameInfo.incomingRequestConfirmationDialogRef?.close();
  //     });
  // }

  // createGameRequest(gameInfo: IGameInfo) {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gameRequest',
  //     gameKey: gameInfo.key,
  //     gameRequestStatus: 'pending'
  //   };
  // }

  sendGameRequest(gameInfo: IGameInfo, userId: string, players: IPlayer[]): ISocketMessage | undefined {
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
      gameRequestStatus: 'pending',
      gamePlayerUpdate: players
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameRequestResponse(gameInfo: IGameInfo, userId: string, gameRequestStatus: GameRequestStatus): ISocketMessage | undefined {
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
      gameRequestStatus
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameStart(gameInfo: IGameInfo, userId: string): ISocketMessage | undefined {
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
      gameRequestStatus: 'gameStart'
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }


  // Cancel Game
  cancelMultiPlayerGame(gameInfo: IGameInfo, players: IPlayer[], error: string): IGameMultiPlayerConnection | undefined {
    const multiPlayerGameIndex = this.multiPlayerGames.findIndex(g => g.gameInfo.key === gameInfo.key);
    if (multiPlayerGameIndex < 0) return;

    const multiPlayerGame = this.multiPlayerGames.splice(multiPlayerGameIndex, 1)[0];

    // Send all players a Cancel Request
    const gameRemoteCancelledPlayers = players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.userId || !this.userService.me || player.userId === this.userService.me.userId) return arr;

      const connectionSocketMessage = this.sendGameCancelRequest(gameInfo, player, error);
      if (connectionSocketMessage)
        arr.push({
          player,
          connectionStatus: 'requestCancel',
          connectionSocketMessage,
          hasUser: !!player.userId,
          isMe: player.userId && player.userId === this.userService.me?.userId ? true : false
        });

      return arr;
    }, [] as IGameRemotePlayer[]);

    multiPlayerGame.players = gameRemoteCancelledPlayers;
    return multiPlayerGame;
  }

  sendGameCancelRequest(gameInfo: IGameInfo, player: IPlayer, error: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }
    if (!player.userId) {
      this.loggerService.log('Player is a local user');
      return;
    }

    const socketMessage: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameInfo.key,
      gameRequestStatus: 'requestCancel',
      error
    };

    this.socketService.sendMessage(player.userId, socketMessage);
    return socketMessage;
  }


  askPlayerForGameRequestConfirmation(sentByUserName: string, gameInfo: IGameInfo): Observable<any> {
    const yesNoConfig: IYesNoConfig = {
      title: 'New Game Request',
      message: `${sentByUserName} requested you to join ${gameInfo.name}.`,
      countDown: this.gameRequestWaitTime,
      noButtonText: 'Cancel',
      yesButtonText: 'Join'
    };

    return this.dialog.open(YesNoDialogComponent, {
      data: yesNoConfig
    }).afterClosed()
  }
  hanldeIncomingGameRequest(): void {
    this.incomingGameRequest$
      .subscribe(gameRequest => {
        if (!gameRequest) return;
        console.log('incoming request = ', gameRequest)
        const requestUser: IUser = { userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName };

        const gameInfo = this.gameDashboardService.games.find(g => g.key === gameRequest.gameKey);
        if (!gameInfo) {
          this.loggerService.log('No game found for the game request');
          return;
        }

        this.askPlayerForGameRequestConfirmation(gameRequest.sourceUserName, gameInfo)
          .pipe(take(1))
          .subscribe(confirm => {

            if (confirm && gameRequest.gamePlayerUpdate) {
              this.startMultiPlayerGame(gameInfo, gameRequest.gamePlayerUpdate, requestUser);
              this.userService.addNewUserConnection({ userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName });
              this.gameDashboardService.selectedGame.next(gameInfo);
            } else {
              // this.sendCancelRequests();
              this.sendGameRequestResponse(gameInfo, requestUser.userId, 'rejected');
            }
          });
      });
  }

  // sendGameCancelRequest(gameInfo: IGameInfo, player: IPlayer): void {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }
  //   if (!player.userId) {
  //     this.loggerService.log('Player is a local user');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gameRequest',
  //     gameKey: gameInfo.key,
  //     gameRequestStatus: 'requestCancel'
  //   };
  //   this.socketService.sendMessage(player.userId, message);
  // }

  // sendGameRequestResponse(gameInfo: IGameInfo, source: IUser, response: boolean): void {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gameRequest',
  //     gameKey: gameInfo.key,
  //     gameRequestStatus: response ? 'accepted' : 'rejected'
  //   };
  //   this.socketService.sendMessage(source.userId, message);
  // }

  // sendGamePlayerUpdate(gameInfo: IGameInfo, players: IPlayer[]): void {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gamePlayerUpdate',
  //     gameKey: gameInfo.key,
  //     gamePlayerUpdate: players
  //   };
  //   // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
  //   this.sendMessagesToPlayer(players, message);
  // }

  // sendGameStartRequest(gameInfo: IGameInfo, players: IPlayer[], gameState: any): void {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gameRequest',
  //     gameKey: gameInfo.key,
  //     gameRequestStatus: 'gameStart',
  //     gameState
  //   };
  //   // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
  //   this.sendMessagesToPlayer(players, message);
  // }

  // sendGameStateUpdate(gameInfo: IGameInfo, players: IPlayer[], gameState: any): void {
  //   if (!this.userService.me) {
  //     this.loggerService.log('Me user is not set');
  //     return;
  //   }

  //   const message: ISocketMessage = {
  //     sentOn: new Date(),
  //     sourceUserId: this.userService.me.userId,
  //     sourceUserName: this.userService.me.userName,
  //     type: 'gameState',
  //     gameKey: gameInfo.key,
  //     gameState
  //   };
  //   // players.forEach(p => p.userId ? this.socketService.sendMessage(p.userId, message) : null);
  //   this.sendMessagesToPlayer(players, message);
  // }

  // sendMessagesToPlayer(players: IPlayer[], message: ISocketMessage) {
  //   players.forEach(p => p.userId && p.userId !== this.userService.me?.userId ? this.socketService.sendMessage(p.userId, message) : null);
  // }
}
