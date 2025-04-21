import { Directive, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, Observable, Subject, filter, merge, take, takeUntil, timeout } from "rxjs";
import { GameDashboardService } from "../services/game-dashboard.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { IGameInfo, IGameMultiPlayerConnection, IInfo, IPlayer, ISocketMessage, IUser, IYesNoConfig } from "../interfaces";
import { MultiPlayerService } from "../services/multi-player.service";
import { YesNoDialogComponent } from "./yes-no-dialog/yes-no-dialog.component";
import { generateHexId } from "../utils/support.utils";
import { InfoComponent } from "./info/info.component";

@Directive()
export abstract class BaseComponent implements OnInit, OnDestroy {

    gameInfo?: IGameInfo;
    gameId: string;
    mpg?: IGameMultiPlayerConnection;
    players: IPlayer[] = [];

    isWaitingForGameToStart = new BehaviorSubject<string | undefined>(undefined);

    protected isComponentActive = new Subject<boolean>();
    private gameEnded = new Subject<boolean>();

    get selectedPlayer(): IPlayer | undefined {
        return undefined;
    }

    abstract setLocalPlayers(players: IPlayer[]): void;
    abstract setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void;
    abstract setPlayers(repeatSamePlayer: boolean): Observable<IPlayer[]> | undefined;
    abstract setPlayersAndStartGame(repeatSamePlayer: boolean): void;

    abstract getGameState(): any;
    abstract setGameState(state: any): void;

    abstract loadGameState(): void;
    abstract resetGame(): void;
    abstract saveGameState(): void;

    abstract checkWinner(): any;


    get isMultiPlayerGame(): boolean {
        return this.players.filter(p => p.userId !== undefined).length > 1
    }

    constructor(
        protected gameDashboardService: GameDashboardService,
        protected multiPlayerService: MultiPlayerService,
        protected dialog: MatDialog) {

        this.gameId = generateHexId(16);
        // this.gameOwner = this.gameDashboardService.selectedGame.value?.gameOwner;
    }

    ngOnInit(): void {
        if (!this.gameDashboardService.selectedGame.value) return;

        // If player is playing or setting any current game then all incoming requests will be rejected
        this.listenForIncomingGameRematchRequest();

        this.gameInfo = { ...this.gameDashboardService.selectedGame.value };
        if (!this.multiPlayerService.anyGameInProgressStatus(this.gameDashboardService.selectedGame.value.key)) {
            this.loadGameState();
        }

        else {
            this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key);
            if (!this.mpg) {
                this.loadGameState();
                return;
            }

            this.gameId = this.mpg.gameId;
            if (this.mpg.gameState) {
                this.setGameState(this.mpg.gameState);
            }


            this.saveGameState();

            if (this.mpg.gamePlayState !== 'gameEnd') {
                this.startWaiting();
                this.startListening();
            }
        }
    }

    ngOnDestroy(): void {
        this.saveGameState();
        this.isComponentActive.next(true);
        this.isComponentActive.complete();
        this.isWaitingForGameToStart.complete();
        this.gameEnded.complete();
    }

    startWaiting(): void {
        if (!this.mpg) return;

        // Player Setting - Wait for Game Start
        if (this.mpg.gamePlayState === 'playerSetting') {
            this.waitForGameStart(this.mpg);
        }

        // For Player/s when not in Player Setting means Game Started and player needs gameState update
        else if (!this.mpg.isMeTheGameOwner && this.mpg.gameOwner) {
            this.multiPlayerService.requestForGameUpdate(this.mpg.gameId, this.mpg, this.mpg.gameOwner.userId);
            this.waitForGameUpdateOrNoUpdate();
        }
    }

    startListening(): void {
        if (!this.mpg) return;

        // Listeners for Game Owner
        if (this.mpg.isMeTheGameOwner) {
            this.listenForPlayerLeft();

        } else { // Listeners for Players
            this.listenForPlayerUpdate();
            this.listenForGameCancelled();

        }
        this.listenForGameStateChange();
        this.listenForGameEndMessage();
    }

    getPlayerConfigPopup(repeatSamePlayer: boolean): MatDialogRef<any, any> | undefined {
        return undefined;
    }




    // ------------------ Game ------------------ //

    // Game Start wait
    private askForMoreWait(): Observable<any> {
        const yesNoConfig: IYesNoConfig = {
            title: 'Time Out',
            message: `Timeout occurred while waiting for the game to begin. Would you like to wait a little longer?`,
            countDown: this.multiPlayerService.gameRequestWaitTime,
            noButtonText: 'Cancel',
            yesButtonText: 'Wait'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }
    waitForGameStart(mpg: IGameMultiPlayerConnection) {
        this.isWaitingForGameToStart.next('Waiting for game to start...');
        this.multiPlayerService.incomingGameStart$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive),
                take(1),
                timeout(this.multiPlayerService.gameRequestWaitTime * 1000) // wait for 1 min for all players to accept and start game
            )
            .subscribe({
                next: gameStartRequest => {
                    this.isWaitingForGameToStart.next(undefined);
                    if (gameStartRequest && gameStartRequest.gameState) {

                        this.mpg = this.multiPlayerService.getMultiPlayerGame(gameStartRequest.gameKey);
                        if (!this.mpg) return;

                        this.multiPlayerService.updateMultiPlayerGameState(gameStartRequest.gameId, gameStartRequest.gameKey, gameStartRequest.gameState);
                        this.multiPlayerService.updateMultiPlayerGamePlayState(gameStartRequest.gameId, gameStartRequest.gameKey, 'gameInProgress');
                        this.setGameState(gameStartRequest.gameState);
                    }
                },

                error: () => {
                    this.isWaitingForGameToStart.next(undefined);
                    this.askForMoreWait()
                        .pipe(take(1), takeUntil(this.isComponentActive))
                        .subscribe({
                            next: confirm => {

                                if (!confirm) {
                                    this.multiPlayerService.sendLeaveGameMessage(mpg.gameId, mpg, mpg.gameOwner.userId)
                                    this.multiPlayerService.removeGameAndGotoHomePage(mpg.gameInfo.key, mpg.gameId);
                                }
                                else this.waitForGameStart(mpg);
                            }
                        })
                }
            });
    }

    // Game state not received after request sent
    private askNewGameAsNoUpdate(): Observable<any> {
        const yesNoConfig: IYesNoConfig = {
            title: 'No Game Update',
            message: `Failed to aquire latest game update. It may have been cancelled or concluded. Would you like to start new game?`,
            countDown: this.multiPlayerService.gameRequestWaitTime,
            noButtonText: 'No',
            yesButtonText: 'Yes'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed();
    }
    waitForGameUpdateOrNoUpdate(): void {
        // start loading circle
        merge(this.multiPlayerService.incomingGameStateChanged$, this.multiPlayerService.incomingGameNotFound$)
            .pipe(
                filter(socketMessage => socketMessage?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                take(1), takeUntil(this.isComponentActive),
                timeout(this.multiPlayerService.gameRequestWaitTime * 1000)
            )
            .subscribe({
                next: () => {
                    // do nothing as game state update was received
                },
                error: () => { // timeout error occured ad nothing was received

                    this.askNewGameAsNoUpdate().pipe(take(1))
                        .subscribe(confirm => {

                            if (!confirm) this.multiPlayerService.gotoHomePage();

                            else {
                                if (!this.gameDashboardService.selectedGame.value) return;

                                this.gameDashboardService.removeGameFromLocalStorageByGameId(this.gameDashboardService.selectedGame.value.key, this.gameId);
                                this.multiPlayerService.removeMPGFromLocalStorageByGameId(this.gameDashboardService.selectedGame.value.key, this.gameId);
                                this.resetGame();
                                this.players = [];
                                this.setPlayersAndStartGame(false);
                            }
                        })
                }
            });
    }



    // ------------------ Listeners ------------------ //

    // Game Updated
    listenForGameStateChange(): void {
        this.multiPlayerService.incomingGameStateChanged$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive), takeUntil(this.gameEnded)
            )
            .subscribe(gameStateRequest => {
                if (!gameStateRequest || !gameStateRequest.gameState) return;

                this.setGameState(gameStateRequest.gameState);
                this.saveGameState();
            });
    }

    // Game Ended
    listenForGameEndMessage(): void {
        this.multiPlayerService.incomingGameEndMessage$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive), takeUntil(this.gameEnded)
            )
            .subscribe(gameEndMessage => {
                if (!gameEndMessage || !gameEndMessage.gameWinner) return;

                this.gameDashboardService.pushWinner(gameEndMessage.gameWinner);

                //Set State
                this.setGameState(gameEndMessage.gameState);

                // Update local storage game
                this.gameDashboardService.updateGameState(gameEndMessage.gameId, gameEndMessage.gameKey, gameEndMessage.gameState);

                // Remove MPG Game
                this.multiPlayerService.removeMPGFromLocalStorageByGameId(gameEndMessage.gameKey, gameEndMessage.gameId);

                this.gameEnded.next(true);
                this.listenForGameRematchRequest();
            });
    }

    // Game Cancelled
    private informGameCancelled(gameCancelRequest: ISocketMessage): Observable<any> {
        const infoConfig: IInfo = {
            message: (gameCancelRequest.error ?? '')
        }

        return this.dialog.open(InfoComponent, {
            data: infoConfig
        }).afterClosed()
    }
    listenForGameCancelled(): void {
        this.multiPlayerService.incomingGameRequestCancel$
            .pipe(
                filter(socketMessage => socketMessage?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                take(1), takeUntil(this.isComponentActive), takeUntil(this.gameEnded)
            )
            .subscribe({
                next: gameCancelRequest => {
                    this.isWaitingForGameToStart.next(undefined);
                    if (!gameCancelRequest) return;

                    this.informGameCancelled(gameCancelRequest).pipe(take(1))
                        .subscribe(() => {
                            this.multiPlayerService.removeGameAndGotoHomePage(gameCancelRequest.gameKey, gameCancelRequest.gameId);
                        })
                }
            });
    }

    // Player Left Game
    private informGamePlayerLeft(incomingGameLeftMessage: ISocketMessage): Observable<any> {
        const infoConfig: IInfo = {
            message: `${incomingGameLeftMessage.sourceUserName} has left the game.`
        }

        return this.dialog.open(InfoComponent, {
            data: infoConfig
        }).afterClosed()
    }
    listenForPlayerLeft(): void {
        this.multiPlayerService.incomingGameLeft$
            .pipe(
                filter(socketMessage => socketMessage?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive), takeUntil(this.gameEnded)
            )
            .subscribe({
                next: incomingGameLeftMessage => {
                    if (!incomingGameLeftMessage) return;

                    this.informGamePlayerLeft(incomingGameLeftMessage).pipe(take(1))
                        .subscribe(() => {
                            this.multiPlayerService.removePlayerForMPG(incomingGameLeftMessage.gameKey, incomingGameLeftMessage.sourceUserId);
                            this.gameDashboardService.removeGamePlayer(incomingGameLeftMessage.gameKey, incomingGameLeftMessage.sourceUserId);
                            const newState = this.gameDashboardService.loadGameState(incomingGameLeftMessage.gameKey);
                            if (newState) this.setGameState(newState);
                            const mpg = this.multiPlayerService.getMultiPlayerGame(incomingGameLeftMessage.gameKey)
                            if (mpg) {
                                mpg.players.forEach(p => {
                                    if (!p.player.userId) return;

                                    this.multiPlayerService.sendPlayerUpdate(incomingGameLeftMessage.gameId, mpg, p.player.userId);
                                });
                            }
                        })
                }
            });
    }

    // Player Update
    listenForPlayerUpdate(): void {
        this.multiPlayerService.incomingGamePlayerUpdate$
            .pipe(
                filter(socketMessage => socketMessage?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive), takeUntil(this.gameEnded)
            )
            .subscribe({
                next: playerUpdateMessage => {
                    if (!playerUpdateMessage || !playerUpdateMessage.gamePlayerUpdate) return;

                    const newPlayers = playerUpdateMessage.gamePlayerUpdate.map(p => p.userId).filter(userId => !!userId);
                    const mpg = this.multiPlayerService.getMultiPlayerGame(playerUpdateMessage.gameKey);
                    if (mpg) {
                        const removedPlayerUserIds = mpg.players.filter(p => p.player.userId && !newPlayers.includes(p.player.userId)).map(p => p.player.userId);
                        removedPlayerUserIds.forEach(userId => {
                            if (!userId) return;

                            this.multiPlayerService.removePlayerForMPG(playerUpdateMessage.gameKey, userId);
                            this.gameDashboardService.removeGamePlayer(playerUpdateMessage.gameKey, userId);
                            this.setGameState(mpg.gameState);
                        });
                    }
                }
            });
    }

    // Rematch
    listenForGameRematchRequest(): void {
        this.multiPlayerService.incomingGameRematchRequest$
            .pipe(
                filter(gameRematchRequest => gameRematchRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive), take(1)
            )
            .subscribe(gameRematchRequest => {
                if (!gameRematchRequest || !gameRematchRequest.gamePlayerUpdate) return;

                const requestUser: IUser = { userId: gameRematchRequest.sourceUserId, userName: gameRematchRequest.sourceUserName };

                const gameInfo = this.gameDashboardService.games.find(g => g.key === gameRematchRequest.gameKey);
                if (!gameInfo) return;

                this.multiPlayerService.askPlayerForGameRematchConfirmation(gameRematchRequest.sourceUserName, gameInfo)
                    .pipe(take(1))
                    .subscribe(confirm => {

                        this.gameId = gameRematchRequest.gameId;

                        if (confirm && gameRematchRequest.gamePlayerUpdate && gameRematchRequest.gameState) {
                            this.setGameState(gameRematchRequest.gameState);
                            this.saveGameState();
                            this.mpg = this.multiPlayerService.startMultiPlayerGameRematch(gameRematchRequest.gameId, gameInfo, gameRematchRequest.gamePlayerUpdate, gameRematchRequest.gameState, requestUser);

                            if (gameRematchRequest.gamePlayState === 'playerSetting')
                                this.startWaiting();
                            this.startListening();

                        } else {
                            this.multiPlayerService.sendGameRequestResponse(gameRematchRequest.gameId, gameInfo, requestUser.userId, 'rejected');
                            this.listenForGameRematchRequest();
                        }
                    });
            });
    }

    // New Game Request
    listenForIncomingGameRematchRequest(): void {
        this.multiPlayerService.incomingGameRequest$
            .pipe(
                filter(gameRematchRequest => gameRematchRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive)
            )
            .subscribe(gameRematchRequest => {
                if (!gameRematchRequest) return;

                this.multiPlayerService.sendBusyMessage(gameRematchRequest.gameId, gameRematchRequest.gameKey, gameRematchRequest.sourceUserId);
            });
    }



    // ------------------ Game ------------------ //

    //  Game State
    sendGameStateUpdate(): void {
        if (!this.mpg) return;

        this.multiPlayerService.saveMultiPlayersToStorage();
        this.mpg.players.forEach(player => {
            if (player.isMe || !player.player.userId || !this.mpg) return;

            this.multiPlayerService.sendGameUpdate(this.gameId, this.mpg, player.player.userId)
        });
    }



    // ------------------ Ask Confirmation ------------------ //

    askToConfirmResetGame(): Observable<any> {
        const yesNoConfig: IYesNoConfig = {
            title: 'Reset Game',
            message: `Are you sure to reset your current game ${this.gameDashboardService.selectedGame.value?.name}?`,
            countDown: this.multiPlayerService.gameRequestWaitTime,
            noButtonText: 'No',
            yesButtonText: 'Yes'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }

    askToConfirmCancelGame(): Observable<any> {
        const yesNoConfig: IYesNoConfig = {
            title: 'Cancel Game',
            message: `Are you sure to cancel your current game ${this.gameDashboardService.selectedGame.value?.name}?`,
            countDown: this.multiPlayerService.gameRequestWaitTime,
            noButtonText: 'No',
            yesButtonText: 'Yes'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }

    askToConfirmLeaveGame(): Observable<any> {
        const yesNoConfig: IYesNoConfig = {
            title: 'Cancel Game',
            message: `Are you sure to leave this game ${this.gameDashboardService.selectedGame.value?.name}?`,
            countDown: this.multiPlayerService.gameRequestWaitTime,
            noButtonText: 'No',
            yesButtonText: 'Yes'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }
}