import { Injectable } from '@angular/core';
import { Observable, filter, take } from 'rxjs';
import { IGameInfo, IGameMultiPlayerConnection, IGameRemotePlayer, IInfo, IPlayer, ISocketMessage, IUser, IYesNoConfig } from '../interfaces';
import { SocketService } from './socket.service';
import { MatDialog, } from '@angular/material/dialog';
import { LoggerService } from './logger.service';
import { GameDashboardService } from './game-dashboard.service';
import { YesNoDialogComponent } from '../components/yes-no-dialog/yes-no-dialog.component';
import { UserService } from './user.service';
import {  GameRequestStatus } from '../types';
import { Router } from '@angular/router';
import { InfoComponent } from '../components/info/info.component';

@Injectable({
  providedIn: 'root'
})
export class MultiPlayerService {

  gameRequestWaitTime = 300; // in seconds
  multiPlayerGamesStorageKey = 'multiPlayerGames';
  multiPlayerGames: IGameMultiPlayerConnection[] = [];

  // Incoming Requests bifercated by type
  public incomingGameRequest$: Observable<ISocketMessage | null>;
  public incomingGameRequestResponse$: Observable<ISocketMessage | null>;

  public incomingGamePlayerUpdate$: Observable<ISocketMessage | null>;
  public incomingGameRequestCancel$: Observable<ISocketMessage | null>;
  public incomingGameLeft$: Observable<ISocketMessage | null>;
  public incomingGameStart$: Observable<ISocketMessage | null>;
  public incomingLatestStateRequest$: Observable<ISocketMessage | null>;
  public incomingGameStateChanged$: Observable<ISocketMessage | null>;
  public incomingGameNotFound$: Observable<ISocketMessage | null>;

  constructor(
    private socketService: SocketService,
    private dialog: MatDialog,
    private loggerService: LoggerService,
    private gameDashboardService: GameDashboardService,
    private userService: UserService,
    private router: Router
  ) {
    this.loadMultiPlayersFromStorage();
    this.removeGarbageMPG();

    this.incomingGameRequestResponse$ = this.getGameRequestOverserver(['accepted', 'rejected']);
    this.incomingGameStart$ = this.getGameRequestOverserver('gameStart');

    this.incomingGameLeft$ = this.getGameRequestOverserver('leftGame');
    this.incomingGameRequest$ = this.getGameRequestOverserver('pending');
    this.incomingGameNotFound$ = this.getGameRequestOverserver('gameNotFound');
    this.incomingGameRequestCancel$ = this.getGameRequestOverserver('requestCancel');
    this.incomingLatestStateRequest$ = this.getGameRequestOverserver('needStateUpdate');

    this.incomingGamePlayerUpdate$ = this.socketService.message$.pipe(filter(message => message?.type === 'gamePlayerUpdate'));
    this.incomingGameStateChanged$ = this.socketService.message$.pipe(filter(message => message?.type === 'gameState'));

    this.handleIncomingGameLeftMessage();
    this.hanldeIncomingGameRequest();
    this.handleIncomingGameNotFound();
    this.handleIncomingGameCancelMessage();
    this.handleIncomingLatestStateRequest();

    this.handleIncomingGamePlayerUpdate();
    this.handleIncomingGameStateUpdate();
    // this.handleIncomingCancelGameRequest();
  }

  private getGameRequestOverserver(status: GameRequestStatus | string[]) {
    if (Array.isArray(status))
      return this.socketService.message$.pipe(filter(message => !!message && message.type === 'gameRequest' && status.includes(message.gameRequestStatus ?? '')));

    return this.socketService.message$.pipe(filter(message => !!message && message?.type === 'gameRequest' && message.gameRequestStatus === status));
  }

  private loadMultiPlayersFromStorage(): void {
    const state = localStorage.getItem(this.multiPlayerGamesStorageKey);
    if (state) this.multiPlayerGames = JSON.parse(state);
  }

  private removeGarbageMPG(): void {
    this.multiPlayerGames = this.multiPlayerGames.filter(mpg => {
      if (mpg.gamePlayState !== 'playerSetting') return true;
      else {
        this.gameDashboardService.removeGameFromLocalStorageByGameId(mpg.gameInfo.key, mpg.gameId);
        return false
      }
    });
    this.saveMultiPlayersToStorage();
  }


  // Public Helper Methods
  saveMultiPlayersToStorage(): void {
    localStorage.setItem(this.multiPlayerGamesStorageKey, JSON.stringify(this.multiPlayerGames));
  }

  gotoHomePage(): void {
    this.router.navigateByUrl('');
  }

  removeMPGFromLocalStorageByGameId(gameKey: string, gameId: string): void {
    const mpg = this.getMultiPlayerGame(gameKey);
    if (mpg?.gameId === gameId)
      this.removeMultiPlayerGame(gameKey);
  }

  removeGameAndGotoHomePage(gameKey: string, gameId: string): void {
    // if selected game is same as Game Not Found game then navigate to home page
    if (this.gameDashboardService.selectedGame.value?.key === gameKey)
      this.gotoHomePage();

    setTimeout(() => {

      // Remove Multiplayer Game
      this.removeMPGFromLocalStorageByGameId(gameKey, gameId);

      // Remove from Local Storage
      this.gameDashboardService.removeGameFromLocalStorageByGameId(gameKey, gameId);

    }, 100);
  }

  anyGameInProgressStatus(gameKey: string): boolean {
    const multiPGame = this.multiPlayerGames.find(game => game.gameInfo.key === gameKey);
    if (!multiPGame) return false;

    return ['gameEnd', 'gameCancel'].indexOf((multiPGame?.gamePlayState, '')) < 0;
  }

  getMultiPlayerGame(gameKey: string): IGameMultiPlayerConnection | undefined {
    return this.multiPlayerGames.find(mpg => mpg.gameInfo.key === gameKey);
  }




  // Multi Player Game (MPG) CRUD Operation
  addMultiPlayerGame(mpg: IGameMultiPlayerConnection): void {
    this.multiPlayerGames.push(mpg);
    this.saveMultiPlayersToStorage();
  }

  removeMultiPlayerGame(gameKey: string) {
    const multiPlayerGameIndex = this.multiPlayerGames.findIndex(g => g.gameInfo.key === gameKey);
    if (multiPlayerGameIndex < 0) return;

    const mpg = this.multiPlayerGames.splice(multiPlayerGameIndex, 1)[0];
    this.saveMultiPlayersToStorage();
    return mpg;
  }


  // Start Game
  startMultiPlayerGame(gameId: string, gameInfo: IGameInfo, players: IPlayer[], gameOwner?: IUser): IGameMultiPlayerConnection | undefined {
    if (this.anyGameInProgressStatus(gameInfo.key) || !this.userService.me) return;

    const gameRemotePlayers = players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.userId || !this.userService.me) return arr;

      const isMe = player.userId === this.userService.me.userId;

      // Set Game request/response
      if (!isMe) {
        const connectionSocketMessage = !gameOwner
          ? this.sendGameRequest(gameId, gameInfo, player.userId, players)
          : this.sendGameRequestResponse(gameId, gameInfo, player.userId, 'accepted');

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
      gameId,
      gameInfo,
      gameOwner: gameOwner ?? this.userService.me,
      gamePlayState: 'playerSetting',
      players: gameRemotePlayers,
      gameState: undefined,
      gameStateHistory: [],
      isMeTheGameOwner: (gameOwner ?? this.userService.me).userId === this.userService.me.userId
    };
    this.addMultiPlayerGame(newMultiPlayerGame);
    return newMultiPlayerGame;

  }


  // Cancel Game
  cancelMultiPlayerGame(gameId: string, gameInfo: IGameInfo, error: string,): IGameMultiPlayerConnection | undefined {

    const multiPlayerGame = this.removeMultiPlayerGame(gameInfo.key);
    if (!multiPlayerGame) return;

    // Send all players a Cancel Request
    const gameRemoteCancelledPlayers = multiPlayerGame.players.reduce((arr: IGameRemotePlayer[], player) => {
      if (!player.player.userId || !this.userService.me || player.player.userId === this.userService.me.userId) return arr;

      const connectionSocketMessage = this.sendGameCancelRequest(gameId, gameInfo, player.player, error);
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

  // Update Players
  removePlayerForMPG(gameKey: string, playerUserId: string) {

    let mpg = this.getMultiPlayerGame(gameKey);
    if (!mpg || !this.userService.me) return;

    mpg.players = mpg.players.filter(p => p.player.userId !== playerUserId);
    if (mpg.gameState && mpg.gameState.players)
      mpg.gameState.players = mpg.gameState.players.filter((p: any) => p.userId !== playerUserId);

    this.saveMultiPlayersToStorage();
  }




  // Game Requests
  sendGameRequest(gameId: string, gameInfo: IGameInfo, userId: string, players: IPlayer[]): ISocketMessage | undefined {
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
      gamePlayerUpdate: players,
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameRequestResponse(gameId: string, gameInfo: IGameInfo, userId: string, gameRequestStatus: GameRequestStatus): ISocketMessage | undefined {
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
      gameRequestStatus,
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameStart(gameId: string, mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
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
      gamePlayerUpdate: mpg.players.map(p => p.player),
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameUpdate(gameId: string, mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
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
      gameState: mpg.gameState,
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendPlayerUpdate(gameId: string, mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gamePlayerUpdate',
      gamePlayerUpdate: (mpg.gameState?.players ?? []),
      gameKey: mpg.gameInfo.key,
      gamePlayState: mpg.gamePlayState,
      gameState: mpg.gameState,
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendLeaveGameMessage(gameId: string, mpg: IGameMultiPlayerConnection, userId: string): ISocketMessage | undefined {
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
      gameRequestStatus: 'leftGame',
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  requestForGameUpdate(gameId: string, mpg: IGameMultiPlayerConnection, userId: string) {
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
      gameRequestStatus: 'needStateUpdate',
      gameId
    };

    this.socketService.sendMessage(userId, message);
    return message;
  }

  sendGameCancelRequest(gameId: string, gameInfo: IGameInfo, player: IPlayer, error: string): ISocketMessage | undefined {
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
      error,
      gameId
    };

    this.socketService.sendMessage(player.userId, socketMessage);
    return socketMessage;
  }

  sendGameNotAvailableRequest(gameId: string, gameKey: string, userId: string): ISocketMessage | undefined {
    if (!this.userService.me) {
      this.loggerService.log('Me user is not set');
      return;
    }

    const socketMessage: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.userService.me.userId,
      sourceUserName: this.userService.me.userName,
      type: 'gameRequest',
      gameKey: gameKey,
      gameRequestStatus: 'gameNotFound',
      gameId
    };

    this.socketService.sendMessage(userId, socketMessage);
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
              this.startMultiPlayerGame(gameRequest.gameId, gameInfo, gameRequest.gamePlayerUpdate, requestUser);
              this.userService.addNewUserConnection({ userId: gameRequest.sourceUserId, userName: gameRequest.sourceUserName });
              this.gameDashboardService.selectedGame.next(gameInfo);
            } else {
              // this.sendCancelRequests();
              this.sendGameRequestResponse(gameRequest.gameId, gameInfo, requestUser.userId, 'rejected');
            }
          });
      });
  }

  handleIncomingLatestStateRequest(): void {
    this.incomingLatestStateRequest$
      .subscribe(latestStateRequest => {
        if (!latestStateRequest) return;

        const requestUser: IUser = { userId: latestStateRequest.sourceUserId, userName: latestStateRequest.sourceUserName };

        const mpg = this.multiPlayerGames.find(g => g.gameInfo.key === latestStateRequest.gameKey);
        if (!mpg) {
          this.sendGameNotAvailableRequest(latestStateRequest.gameId, latestStateRequest.gameKey, latestStateRequest.sourceUserId)
          this.loggerService.log('No game found for the game request');
          return;
        }

        this.sendGameUpdate(latestStateRequest.gameId, mpg, requestUser.userId);
      });
  }

  private informNoGameAvailable(): Observable<any> {
    const infoConfig: IInfo = {
      message: 'Game Not Found. It may have been ended or cancelled by game owner.'
    }

    return this.dialog.open(InfoComponent, {
      data: infoConfig
    }).afterClosed()
  }
  handleIncomingGameNotFound(): void {
    this.incomingGameNotFound$
      .subscribe(gameNotFoundMessage => {
        if (!gameNotFoundMessage) return;

        this.informNoGameAvailable().pipe(take(1))
          .subscribe(() => this.removeGameAndGotoHomePage(gameNotFoundMessage.gameKey, gameNotFoundMessage.gameId))

      });
  }

  handleIncomingGamePlayerUpdate(): void {
    this.incomingGamePlayerUpdate$
      .subscribe(playerUpdateMessage => {
        if (!playerUpdateMessage || !playerUpdateMessage.gamePlayerUpdate || playerUpdateMessage.gameKey === this.gameDashboardService.selectedGame.value?.key) return;

        const newPlayers = playerUpdateMessage.gamePlayerUpdate.map(p => p.userId).filter(userId => !!userId);
        const mpg = this.getMultiPlayerGame(playerUpdateMessage.gameKey);
        if (mpg) {
          const removedPlayerUserIds = mpg.players.filter(p => p.player.userId && !newPlayers.includes(p.player.userId)).map(p => p.player.userId);
          removedPlayerUserIds.forEach(userId => {
            if (!userId) return;

            this.removePlayerForMPG(playerUpdateMessage.gameKey, userId);
            this.gameDashboardService.removeGamePlayer(playerUpdateMessage.gameKey, userId);
          });
        }
      });
  }

  handleIncomingGameStateUpdate(): void {
    this.incomingGameStateChanged$
      .subscribe(gameStateRequest => {
        if (!gameStateRequest || gameStateRequest.gameKey === this.gameDashboardService.selectedGame.value?.key) return;

        // Save Game State
        const currentState = this.gameDashboardService.loadGameState(gameStateRequest.gameKey);
        if (currentState && currentState.gameId === gameStateRequest.gameId) {
          this.gameDashboardService.saveGameState(gameStateRequest.gameState, gameStateRequest.gameKey);
        }

        // Save Multi Player Game (MPG)
        const mpg = this.getMultiPlayerGame(gameStateRequest.gameKey);
        if (mpg && mpg.gameState?.gameId === gameStateRequest.gameId) {
          mpg.gameState = gameStateRequest.gameState;
          this.saveMultiPlayersToStorage();
        }
      });
  }

  handleIncomingGameCancelMessage(): void {
    this.incomingGameRequestCancel$
      .subscribe(gameCancelRequest => {
        if (!gameCancelRequest || gameCancelRequest.gameKey === this.gameDashboardService.selectedGame.value?.key) return;

        // Remove Multiplayer Game
        this.removeMPGFromLocalStorageByGameId(gameCancelRequest.gameKey, gameCancelRequest.gameId);

        // Remove from Local Storage
        this.gameDashboardService.removeGameFromLocalStorageByGameId(gameCancelRequest.gameKey, gameCancelRequest.gameId);

      });
  }

  handleIncomingGameLeftMessage(): void {
    this.incomingGameLeft$
      .subscribe(incomingGameLeftMessage => {
        if (!incomingGameLeftMessage || incomingGameLeftMessage.gameKey === this.gameDashboardService.selectedGame.value?.key) return;

        // Remove Player from Multiplayer Game
        this.removePlayerForMPG(incomingGameLeftMessage.gameKey, incomingGameLeftMessage.sourceUserId);

        // Remove Player from Local Storage saved game
        this.gameDashboardService.removeGamePlayer(incomingGameLeftMessage.gameKey, incomingGameLeftMessage.sourceUserId);

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
