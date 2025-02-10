import { PLAYER_COLOR } from "../config";
import { GameRequestStatus } from "../types";
import { IGameInfo } from "./game-info.interface";

export interface ILudoCoin {
    id: number;
    position: number;
    finished: boolean;
}
export interface IPlayer {
    name: string;
    userId?: string;
    color?: PLAYER_COLOR;
    ludoCoins?: ILudoCoin[];
}

export interface IPlayerAskConfig {
    game: IGameInfo;
    minPlayerCount: number;
    maxPlayerCount: number;
    askForName: true;
    preFillPlayers?: IPlayer[];
    colorOptions?: PLAYER_COLOR[];
}