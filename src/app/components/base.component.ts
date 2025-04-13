import { Directive, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, filter, take, takeUntil } from "rxjs";
import { GameDashboardService } from "../services/game-dashboard.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { IGameMultiPlayerConnection, IPlayer, IUser, IYesNoConfig } from "../interfaces";
import { MultiPlayerService } from "../services/multi-player.service";
import { YesNoDialogComponent } from "./yes-no-dialog/yes-no-dialog.component";

@Directive()
export abstract class BaseComponent implements OnInit, OnDestroy {

    mpg?: IGameMultiPlayerConnection;
    players: IPlayer[] = [];

    protected isComponentActive = new Subject<boolean>();

    get selectedPlayer(): IPlayer | undefined {
        return undefined;
    }

    abstract getGameState(): any;
    abstract setGameState(state: any): void;

    abstract loadGameState(): void;
    abstract resetGame(): void;
    abstract saveGameState(): void;

    private playerConfigPopupRef?: MatDialogRef<any, any>;

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
        // this.gameOwner = this.gameDashboardService.selectedGame.value?.gameOwner;
    }

    ngOnInit(): void {
        if (!this.gameDashboardService.selectedGame.value) return;

        if (!this.multiPlayerService.anyGameInProgressStatus(this.gameDashboardService.selectedGame.value.key))
            this.loadGameState();

        else {
            this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key);

            if (this.mpg?.gamePlayState === 'playerSetting')
                this.waitForGameStart();

            else {
                if (this.mpg?.gameOwner) {
                    if (!this.mpg.isMeTheGameOwner)
                        this.multiPlayerService.requestForGameUpdate(this.mpg, this.mpg.gameOwner.userId);
                    else
                        this.setGameState(this.mpg.gameState);
                }


                this.listenForGameStateChange();
            }
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

    waitForGameStart() {
        this.multiPlayerService.incomingGameStart$.pipe(
            filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
            takeUntil(this.isComponentActive),
            take(1)
        )
            .subscribe(gameStartRequest => {
                if (gameStartRequest && gameStartRequest.gameState) {

                    this.mpg = this.multiPlayerService.getMultiPlayerGame(gameStartRequest.gameKey);
                    if (!this.mpg) return;

                    this.mpg.gameState = gameStartRequest.gameState;
                    this.mpg.gamePlayState = 'gameInProgress'
                    this.setGameState(gameStartRequest.gameState);
                    this.listenForGameStateChange();
                }
                this.playerConfigPopupRef?.close();
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

            this.multiPlayerService.sendGameUpdate(this.mpg, player.player.userId)
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