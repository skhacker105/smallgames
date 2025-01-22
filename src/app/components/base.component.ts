import { Directive, OnDestroy, OnInit } from "@angular/core";

@Directive()
export abstract class BaseComponent implements OnInit, OnDestroy {
    abstract loadGameState(): void;
    abstract checkWinner(): boolean;
    abstract resetGame(): void;
    abstract saveGameState(): void;

    ngOnInit(): void {
        this.loadGameState();
    }

    ngOnDestroy(): void {
        this.saveGameState();
    }
}