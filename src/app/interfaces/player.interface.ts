import { PLAYER_COLOR } from "../config";

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
    minPlayerCount: number;
    maxPlayerCount: number;
    askForName: true;
    preFillPlayers?: IPlayer[];
    colorOptions?: PLAYER_COLOR[];
}