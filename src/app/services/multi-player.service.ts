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
  multiPlayerGamesStorageKey = 'multiPlayerGames';
  multiPlayerGames: IGameMultiPlayerConnection[] = [];

  // Incoming Requests bifercated by type
  public incomingGameRequest$: Observable<ISocketMessage | null>;
  public incomingGameRequestResponse$: Observable<ISocketMessage | null>;

  public incomingGameRequestCancel$: Observable<ISocketMessage | null>;
  public incomingGameLeft$: Observable<ISocketMessage | null>;
  public incomingGamePlayerUpdate$: Observable<ISocketMessage | null>;
  public incomingGameStart$: Observable<ISocketMessage | null>;
  public incomingLatestStateRequest$: Observable<ISocketMessage | null>;
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
    this.incomingLatestStateRequest$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameRequest' && message.gameRequestStatus === 'needStateUpdate'));
    this.incomingGameStateChanged$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameState'));

    this.loadMultiPlayersToStorage();
    this.hanldeIncomingGameRequest();
    this.handleIncomingStateUpdateRequest();
    // this.handleIncomingCancelGameRequest();
  }

  saveMultiPlayersToStorage(): void {
    localStorage.setItem(this.multiPlayerGamesStorageKey, JSON.stringify(this.multiPlayerGames));
  }

  private loadMultiPlayersToStorage(): void {
    const state = localStorage.getItem(this.multiPlayerGamesStorageKey);
    if (state) this.multiPlayerGames = JSON.parse(state);
  }

  anyGameInProgressStatus(gameKey: string): boolean {
    const multiPGame = this.multiPlayerGames.find(game => game.gameInfo.key === gameKey);
    if (!multiPGame) return false;

    return ['gameEnd', 'gameCancel'].indexOf((multiPGame?.gamePlayState, '')) < 0;
  }

  getMultiPlayerGame(gameKey: string): IGameMultiPlayerConnection | undefined {
    return this.multiPlayerGames.find(mpg => mpg.gameInfo.key === gameKey);
  }


  // Start Game
  startMultiPlayerGame(gameInfo: IGameInfo, players: IPlayer[], gameOwner?: IUser): IGameMultiPlayerConnection | undefined {
    if (this.anyGameInProgressStatus(gameInfo.key) || !this.userService.me) return;

    const gameRemotePlayers = players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.userId || !this.userService.me) return arr;

      const isMe = player.userId === this.userService.me.userId;

      // Set Game request/response
      if (!isMe) {
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
      } else { // My Player
        arr.push({
          hasUser: true,
          isMe: true,
          player
        });
      }
      return arr;
    }, [] as IGameRemotePlayer[]);

    const newMultiPlayerGame: IGameMultiPlayerConnection = {
      gameInfo,
      gameOwner: gameOwner ?? this.userService.me,
      gamePlayState: 'playerSetting',
      players: gameRemotePlayers,
      gameState: undefined,
      gameStateHistory: [],
      isMeTheGameOwner: (gameOwner ?? this.userService.me).userId === this.userService.me.userId
    };
    this.multiPlayerGames.push(newMultiPlayerGame);
    return newMultiPlayerGame;

  }


  // Game Requests
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

  sendGameStart(mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: mpg.gameInfo.key,
      gameRequestStatus: 'gameStart',
      gameState: mpg.gameState,
      gamePlayerUpdate: mpg.players.map(p => p.player)
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameUpdate(mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameState',
      gameKey: mpg.gameInfo.key,
      gamePlayState: mpg.gamePlayState,
      gameState: mpg.gameState
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendLeaveGameMessage(mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: mpg.gameInfo.key,
      gameRequestStatus: 'leftGame'
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  requestForGameUpdate(mpg: IGameMultiPlayerConnection, userId: string) {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: mpg.gameInfo.key,
      gameRequestStatus: 'needStateUpdate'
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }


  // Cancel Game
  cancelMultiPlayerGame(gameInfo: IGameInfo, error: string): IGameMultiPlayerConnection | undefined {
    const multiPlayerGameIndex = this.multiPlayerGames.findIndex(g => g.gameInfo.key === gameInfo.key);
    if (multiPlayerGameIndex < 0) return;

    const multiPlayerGame = this.multiPlayerGames.splice(multiPlayerGameIndex, 1)[0];

    // Send all players a Cancel Request
    const gameRemoteCancelledPlayers = multiPlayerGame.players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.player.userId || !this.userService.me || player.player.userId === this.userService.me.userId) return arr;

      const connectionSocketMessage = this.sendGameCancelRequest(gameInfo, player.player, error);
      if (connectionSocketMessage)
        arr.push({
          player: player.player,
          connectionStatus: 'requestCancel',
          connectionSocketMessage,
          hasUser: !!player.player.userId,
          isMe: player.player.userId && player.player.userId === this.userService.me?.userId ? true : false
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


  // Handling Incoming
  private askPlayerForGameRequestConfirmation(sentByUserName: string, gameInfo: IGameInfo): Observable<any> {
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

  handleIncomingStateUpdateRequest() {
    this.incomingLatestStateRequest$
    .subscribe(latestStateRequest => {
      if (!latestStateRequest) return;

      const requestUser: IUser = { userId: latestStateRequest.sourceUserId, userName: latestStateRequest.sourceUserName };

      const mpg = this.multiPlayerGames.find(g => g.gameInfo.key === latestStateRequest.gameKey);
      if (!mpg) {
        this.loggerService.log('No game found for the game request');
        return;
      }

      this.sendGameUpdate(mpg, requestUser.userId);
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
