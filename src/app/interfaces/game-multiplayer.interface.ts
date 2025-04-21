import { MatDialogRef } from "@angular/material/dialog";
import { GamePlayState, GameRequestStatus, GameState } from "../types";
import { IGameInfo, IPlayer, ISocketMessage, IUser } from "./";
import { Observable } from "rxjs";

export interface IGameMultiPlayerConnection {
    gameId: string;
    gameInfo: IGameInfo;
    gameOwner: IUser;
    gamePlayState: GamePlayState;
    isMeTheGameOwner: boolean;

    incomingRequestConfirmationDialogRef?: MatDialogRef<any>;

    players: IGameRemotePlayer[];

    gameState: GameState;
    gameStateHistory: IGameStateHistory[];
    lastStateSentOn?: Date;
    lastStateReceivedOn?: Date;
}

export interface IGameRemotePlayer {
    player: IPlayer;
    isMe: boolean;
    hasUser: boolean;
    connectionStatus?: GameRequestStatus;
    connectionSocketMessage?: ISocketMessage;
    connectionResponseSocketMessage?: ISocketMessage;

    lastAcknowledgedPlayState?: GameState;
    lastAcknowledgedPlayTimestamp?: Date;
}

export interface IGameStateHistory {
    state: GameState;
    timestamp: Date;
    initiatedBy: IUser; // who initiated the state change
    message: ISocketMessage; // unique ID for the state change message
    acknowledgments: IPlayerAcknowledgment[];
}

export interface IPlayerAcknowledgment {
    playerUserId: string;
    received: boolean;
    timestamp?: Date; // when acknowledgment was received
}
