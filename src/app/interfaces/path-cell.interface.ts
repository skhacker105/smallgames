import { IPlayer } from "./player.interface";

export interface IPathCell {
    cellNumber: number;
    finishPath?: IPathCell[];
    isSafe?: boolean;
    color?: string;
    isStart?: boolean;
    backgroundColor?: string;
    isFinishingPath?: boolean;
}