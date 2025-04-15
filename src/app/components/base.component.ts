import { Directive, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, filter, merge, take, takeUntil, timeout } from "rxjs";
import { GameDashboardService } from "../services/game-dashboard.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { IGameMultiPlayerConnection, IInfo, IPlayer, IUser, IYesNoConfig } from "../interfaces";
import { MultiPlayerService } from "../services/multi-player.service";
import { YesNoDialogComponent } from "./yes-no-dialog/yes-no-dialog.component";
import { generateHexId } from "../utils/support.utils";
import { InfoComponent } from "./info/info.component";

@Directive()
export abstract class BaseComponent implements OnInit, OnDestroy {

    gameId: string;
    mpg?: IGameMultiPlayerConnection;
    players: IPlayer[] = [];

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

        if (!this.multiPlayerService.anyGameInProgressStatus(this.gameDashboardService.selectedGame.value.key))
            this.loadGameState();

        else {
            this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key);
            if (!this.mpg) {
                this.loadGameState();
                return;
            }

            if (this.mpg.gameState)
                this.setGameState(this.mpg.gameState);

            if (this.mpg?.gamePlayState === 'playerSetting')
                this.waitForGameStart(this.mpg);

            else if (this.mpg.gameOwner && !this.mpg.isMeTheGameOwner) {
                this.waitForGameUpdateOrNoUpdate();
                this.multiPlayerService.requestForGameUpdate(this.gameId, this.mpg, this.mpg.gameOwner.userId);
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

    private waitMoreForGameStartConfirmation() {
        const yesNoConfig: IYesNoConfig = {
            title: 'Time Out',
            message: `Timed-out while waiting for the game to start. Will you wait longer for the game to start?`,
            countDown: this.multiPlayerService.gameRequestWaitTime * 2,
            noButtonText: 'Cancel',
            yesButtonText: 'Wait'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }
    waitForGameStart(mpg: IGameMultiPlayerConnection) {
        this.multiPlayerService.incomingGameStart$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive),
                take(1),
                timeout((this.multiPlayerService.gameRequestWaitTime * 2) * 1000) // wait for 1 min for all players to accept and start game
            )
            .subscribe({
                next: gameStartRequest => {
                    if (gameStartRequest && gameStartRequest.gameState) {

                        this.mpg = this.multiPlayerService.getMultiPlayerGame(gameStartRequest.gameKey);
                        if (!this.mpg) return;

                        this.mpg.gameState = gameStartRequest.gameState;
                        this.mpg.gamePlayState = 'gameInProgress'
                        this.setGameState(gameStartRequest.gameState);
                        // this.listenForGameStateChange();
                    }
                },

                error: () => this.waitMoreForGameStartConfirmation()
                    .pipe(take(1), takeUntil(this.isComponentActive))
                    .subscribe({
                        next: confirm => {
                            if (!this.mpg) return;

                            if (!confirm) this.multiPlayerService.sendLeaveGameMessage(this.gameId, this.mpg, this.mpg.gameOwner.userId)
                            else this.waitForGameStart(this.mpg);
                        }
                    })
            });
    }

    private askNewGameAsNoUpdate() {
        const yesNoConfig: IYesNoConfig = {
            title: 'No Game Update',
            message: `Failed to aquire latest game update. It may have been cancelled or concluded. Would you like to start new game?`,
            countDown: this.multiPlayerService.gameRequestWaitTime * 2,
            noButtonText: 'No',
            yesButtonText: 'Yes'
        };

        return this.dialog.open(YesNoDialogComponent, {
            data: yesNoConfig
        }).afterClosed()
    }
    waitForGameUpdateOrNoUpdate() {
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
                            this.players=[];
                            this.setPlayersAndStartGame();
                        }
                    })
                }
            });
    }

    listenForGameStateChange() {
        this.multiPlayerService.incomingGameStateChanged$
            .pipe(
                filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
                takeUntil(this.isComponentActive)
            )
            .subscribe(gameStateRequest => {
                if (gameStateRequest && gameStateRequest.gameState)
                    this.setGameState(gameStateRequest.gameState);
                if (this.selectedPlayer && gameStateRequest?.gameState.winner) this.gameDashboardService.saveGameWinner(this.selectedPlayer);
                this.saveGameState();
            });
    }

    sendGameStateUpdate() {
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