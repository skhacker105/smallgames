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

    get selectedPlayer(): IPlayer | undefined {
        return undefined;
    }

    abstract setLocalPlayers(players: IPlayer[]): void;
    abstract setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void;
    abstract setPlayers(): Observable<IPlayer[]> | undefined;
    abstract setPlayersAndStartGame(): void;

    abstract getGameState(): any;
    abstract setGameState(state: any): void;

    abstract loadGameState(): void;
    abstract resetGame(): void;
    abstract saveGameState(): void;

    abstract checkWinner(): any;


    // get isGameStart(): boolean {
    //     return false;
    //     // return this.gameDashboardService.selectedGame.value?.isGameStart ?? false;
    // }

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

        this.gameInfo = { ...this.gameDashboardService.selectedGame.value };
        if (!this.multiPlayerService.anyGameInProgressStatus(this.gameDashboardService.selectedGame.value.key))
            this.loadGameState();

        else {
            this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key);
            if (!this.mpg) {
                this.loadGameState();
                return;
            }

            this.gameId = this.mpg.gameId;
            if (this.mpg.gameState) {
                this.setGameState(this.mpg.gameState);
                this.checkWinner();

                if (this.mpg.gameState.players)
                    this.players = this.mpg.gameState.players;
            }


            this.saveGameState();

            // Player Setting - Wait for Game Start
            if (this.mpg?.gamePlayState === 'playerSetting') {
                this.waitForGameStart(this.mpg);
            }

            // For Player/s when not in Player Setting means Game Started and player needs gameState update
            else if (!this.mpg.isMeTheGameOwner && this.mpg.gameOwner) {
                this.multiPlayerService.requestForGameUpdate(this.mpg.gameId, this.mpg, this.mpg.gameOwner.userId);
                this.waitForGameUpdateOrNoUpdate();
            }

            // Listeners for Game Owner
            if (this.mpg.isMeTheGameOwner) {
                this.listenForPlayerLeft();

            } else { // Listeners for Players
                this.listenForPlayerUpdate();
                this.listenForGameCancelled();

            }
            this.listenForGameStateChange();
        }
    }

    ngOnDestroy(): void {
        this.saveGameState();
        this.isComponentActive.next(true);
        this.isComponentActive.complete();
    }

    getPlayerConfigPopup(): MatDialogRef<any, any> | undefined {
        return undefined;
    }

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

                        this.mpg.gameState = gameStartRequest.gameState;
                        this.mpg.gamePlayState = 'gameInProgress'
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
                                this.setPlayersAndStartGame();
                            }
                        })
                }
            });
    }

    listenForGameStateChange(): void {
        this.multiPlayerService.incomingGameStateChanged$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive)
            )
            .subscribe(gameStateRequest => {
                if (gameStateRequest && gameStateRequest.gameState)
                    this.setGameState(gameStateRequest.gameState);
                if (this.selectedPlayer && gameStateRequest?.gameState.winner) this.gameDashboardService.saveGameWinner(this.gameId, this.selectedPlayer);
                this.saveGameState();
                this.checkWinner();
            });
    }

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
                take(1), takeUntil(this.isComponentActive)
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
                takeUntil(this.isComponentActive)
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

    listenForPlayerUpdate(): void {
        this.multiPlayerService.incomingGamePlayerUpdate$
            .pipe(
                filter(socketMessage => socketMessage?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive)
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

    sendGameStateUpdate(): void {
        if (!this.mpg) return;

        this.multiPlayerService.saveMultiPlayersToStorage();
        this.mpg.players.forEach(player => {
            if (player.isMe || !player.player.userId || !this.mpg) return;

            this.multiPlayerService.sendGameUpdate(this.gameId, this.mpg, player.player.userId)
        });
    }

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