import { IPlayer } from "./player.interface";

export interface IGameInfo {
    key: string;
    name: string;
    image: string;
    route: string;
    settingsIconNeeded: boolean;
}

export interface IGameWinner {
    key: string;
    winner: IPlayer;
}