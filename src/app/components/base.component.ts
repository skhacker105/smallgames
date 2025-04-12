import { Directive, OnDestroy, OnInit } from "@angular/core";
import { Subject, filter, take, takeUntil } from "rxjs";
import { GameDashboardService } from "../services/game-dashboard.service";
import { MatDialogRef } from "@angular/material/dialog";
import { IPlayer, IUser } from "../interfaces";
import { MultiPlayerService } from "../services/multi-player.service";

@Directive()
export abstract class BaseComponent implements OnInit, OnDestroy {

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

    constructor(protected gameDashboardService: GameDashboardService, protected multiPlayerService: MultiPlayerService) {
        // this.gameOwner = this.gameDashboardService.selectedGame.value?.gameOwner;
    }

    ngOnInit(): void {

        if (!this.multiPlayerService.anyGameInProgressStatus(this.gameDashboardService.selectedGame.value?.key ?? ''))
            this.loadGameState();

        else
            this.waitForGameStart();
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
        console.log('waitForGameStart')
        this.multiPlayerService.incomingGameStart$.pipe(
            filter(gameStartRequest => gameStartRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
            takeUntil(this.isComponentActive),
            take(1)
        )
            .subscribe(gameStartRequest => {
                console.log({gameStartRequest})
                if (gameStartRequest && gameStartRequest.gameState) {
                    this.setGameState(gameStartRequest.gameState);
                    this.listenForGameStateChange();
                    // if (this.gameDashboardService.selectedGame.value)
                    // this.gameDashboardService.selectedGame.value.isGameStart = false;
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
        const selectedGame = this.gameDashboardService.selectedGame.value;
        if (!selectedGame) return;

        // this.gameDashboardService.sendGameStateUpdate(selectedGame, this.players, this.getGameState());
    }
}