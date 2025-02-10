import { ConnectionState, GameRequestStatus } from "../types";
import { IPlayer } from "./player.interface";

export interface ISocketMessage {
    sourceUserId: string;
    sourceUserName: string;
    sentOn: Date;
    type: 'status' | 'gameKey' | 'gameRequest' | 'gamePlayerUpdate' | 'gameState' | 'gameWinner';
    connectionStatus?: ConnectionState;
    gameKey?: string; // Game Request
    gameRequestStatus?: GameRequestStatus;
    gamePlayerUpdate?: IPlayer[];
    gameState?: any;
    gameWinner?: any;
}