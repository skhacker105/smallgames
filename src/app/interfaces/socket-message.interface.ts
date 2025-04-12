import { ConnectionState, GameRequestStatus } from "../types";
import { IPlayer } from "./player.interface";

export interface ISocketMessage {
    sourceUserId: string;
    sourceUserName: string;
    gameKey: string;
    sentOn: Date;
    type: 'status' | 'gameRequest' | 'gamePlayerUpdate' | 'gameState' | 'gameStateAcknowledgment' | 'gameWinner'; //  | 'gameKey'
    connectionStatus?: ConnectionState;
    gameRequestStatus?: GameRequestStatus;
    gamePlayerUpdate?: IPlayer[];
    gameState?: any;
    gameWinner?: any;
    message?: string;
    error?: string;
}