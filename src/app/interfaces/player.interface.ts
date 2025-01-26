export interface IPlayer {
    name: string;
    color?: string;
}

export interface IPlayerAskConfig {
    minPlayerCount: number;
    maxPlayerCount: number;
    askForName: true;
    askForColor?: boolean;
    preFillPlayers?: IPlayer[]
}