import { ConnectionState, GamePlayState, GameRequestStatus } from "../types";
import { IGameWinner, IPlayer } from "./";

export interface ISocketMessage {
    sourceUserId: string;
    sourceUserName: string;
    gameKey: string;
    gameId: string;
    sentOn: Date;
    type: 'status' | 'gameRequest' | 'gamePlayerUpdate' | 'gameState' | 'gameStateAcknowledgment'; //  | 'gameKey'
    connectionStatus?: ConnectionState;
    gameRequestStatus?: GameRequestStatus;
    gamePlayerUpdate?: IPlayer[];
    gameState?: any;
    gamePlayState?: GamePlayState;
    gameWinner?: IGameWinner;
    message?: string;
    error?: string;
}