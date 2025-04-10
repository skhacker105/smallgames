import { MatDialogRef } from "@angular/material/dialog";
import { ConnectionState, GamePlayState, GameState } from "../types";
import { IGameInfo, IPlayer, ISocketMessage, IUser } from "./";

export interface IGameMultiPlayerConnection {
    gameInfo: IGameInfo;
    gameOwner: IUser;
    gamePlayState: GamePlayState;

    requestSocketMessage: ISocketMessage;
    incomingRequestConfirmationDialogRef?: MatDialogRef<any>;

    players: IGameRemotePlayer[];

    gameState: GameState;
    gameStateHistory: IGameStateHistory[];
    lastStateSentOn: Date;
    lastStateReceivedOn: Date;

}

export interface IGameRemotePlayer {
    player: IPlayer;
    connectionStatus?: ConnectionState;

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
