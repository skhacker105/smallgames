import { MatDialogRef } from "@angular/material/dialog";
import { IPlayer } from "./player.interface";

export interface IGameInfo {
    key: string;
    name: string;
    image: string;
    route: string;
    settingsIconNeeded: boolean;
    incomingRequest?: MatDialogRef<any>
}

export interface IGameWinner {
    key: string;
    winner?: IPlayer;
    winners?: IPlayer[];
    isDraw?: boolean;
}