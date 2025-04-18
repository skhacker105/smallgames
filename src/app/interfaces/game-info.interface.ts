import { MatDialogRef } from "@angular/material/dialog";
import { IPlayer, IUser } from "./";

export interface IGameInfo {
    key: string;
    name: string;
    image: string;
    route: string;
    settingsIconNeeded: boolean;
    // incomingRequestConfirmationDialogRef?: MatDialogRef<any>;
    // gameOwner?: IUser;
    // isGameStart?: boolean;
}

export interface IGameWinner {
    key: string;
    gameId: string;
    winner?: IPlayer;
    winners?: IPlayer[];
    isDraw?: boolean;
    winDate: Date;
    score?: string;
    gameDuration?: number;
    gameLevel?: string;
}
