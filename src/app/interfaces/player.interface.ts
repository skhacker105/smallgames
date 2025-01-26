export interface IPlayer {
    name: string;
    color?: string;
    ludoCoins?: { position: number; finished: boolean }[];
}

export interface IPlayerAskConfig {
    minPlayerCount: number;
    maxPlayerCount: number;
    askForName: true;
    askForColor?: boolean;
    preFillPlayers?: IPlayer[]
}