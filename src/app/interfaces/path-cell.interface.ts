import { IPlayer } from "./player.interface";

export interface IPathCell {
    cellNumber: number;
    finishPath?: IPathCell[];
    isSafe?: boolean;
    safeColor?: string;
    allowedColor?: string;
    isPlayerAccepted?: (player: IPlayer) => boolean;
}