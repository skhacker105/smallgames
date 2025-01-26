export interface ILudoCoin {
    position: number; finished: boolean
}
export interface IPlayer {
    name: string;
    color?: string;
    ludoCoins?: ILudoCoin[];
}

export interface IPlayerAskConfig {
    minPlayerCount: number;
    maxPlayerCount: number;
    askForName: true;
    askForColor?: boolean;
    preFillPlayers?: IPlayer[]
}