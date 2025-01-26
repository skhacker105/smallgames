
import { IPathCell, IPlayer } from '../../interfaces';


function createColorAcceptanceMethod(color: string) {
    return (player: IPlayer) => player.color === color;
}

export const LUDO_FINISH_PATH: { [color: string]: IPathCell[] } = {
    'green': [
        { cellNumber: 23, allowedColor: '#6bcf6b', isPlayerAccepted: createColorAcceptanceMethod('green') },
        { cellNumber: 38, allowedColor: '#6bcf6b', isPlayerAccepted: createColorAcceptanceMethod('green') },
        { cellNumber: 53, allowedColor: '#6bcf6b', isPlayerAccepted: createColorAcceptanceMethod('green') },
        { cellNumber: 68, allowedColor: '#6bcf6b', isPlayerAccepted: createColorAcceptanceMethod('green') },
        { cellNumber: 83, allowedColor: '#6bcf6b', isPlayerAccepted: createColorAcceptanceMethod('green') }
    ],
    'yellow': [
        { cellNumber: 115, allowedColor: '#f7e76b', isPlayerAccepted: createColorAcceptanceMethod('yellow') },
        { cellNumber: 116, allowedColor: '#f7e76b', isPlayerAccepted: createColorAcceptanceMethod('yellow') },
        { cellNumber: 117, allowedColor: '#f7e76b', isPlayerAccepted: createColorAcceptanceMethod('yellow') },
        { cellNumber: 118, allowedColor: '#f7e76b', isPlayerAccepted: createColorAcceptanceMethod('yellow') },
        { cellNumber: 119, allowedColor: '#f7e76b', isPlayerAccepted: createColorAcceptanceMethod('yellow') }
    ],
    'blue': [
        { cellNumber: 203, allowedColor: '#6ba8ff', isPlayerAccepted: createColorAcceptanceMethod('blue') },
        { cellNumber: 188, allowedColor: '#6ba8ff', isPlayerAccepted: createColorAcceptanceMethod('blue') },
        { cellNumber: 173, allowedColor: '#6ba8ff', isPlayerAccepted: createColorAcceptanceMethod('blue') },
        { cellNumber: 158, allowedColor: '#6ba8ff', isPlayerAccepted: createColorAcceptanceMethod('blue') },
        { cellNumber: 143, allowedColor: '#6ba8ff', isPlayerAccepted: createColorAcceptanceMethod('blue') },
    ],
    'red': [
        { cellNumber: 107, allowedColor: '#ff6b6b', isPlayerAccepted: createColorAcceptanceMethod('red') },
        { cellNumber: 108, allowedColor: '#ff6b6b', isPlayerAccepted: createColorAcceptanceMethod('red') },
        { cellNumber: 109, allowedColor: '#ff6b6b', isPlayerAccepted: createColorAcceptanceMethod('red') },
        { cellNumber: 110, allowedColor: '#ff6b6b', isPlayerAccepted: createColorAcceptanceMethod('red') },
        { cellNumber: 111, allowedColor: '#ff6b6b', isPlayerAccepted: createColorAcceptanceMethod('red') }
    ]
};

export const LUDO_PATHS: IPathCell[] = [
    { cellNumber: 7 },
    { cellNumber: 8, finishPath: LUDO_FINISH_PATH['green'] },
    { cellNumber: 9 },
    { cellNumber: 24, isSafe: true, safeColor: '#6bcf6b' },
    { cellNumber: 39 },
    { cellNumber: 54 },
    { cellNumber: 69 },
    { cellNumber: 84 },
    { cellNumber: 100 },
    { cellNumber: 101 },
    { cellNumber: 102 },
    { cellNumber: 103, isSafe: true },
    { cellNumber: 104 },
    { cellNumber: 105 },
    { cellNumber: 120, finishPath: LUDO_FINISH_PATH['yellow'] },
    { cellNumber: 135 },
    { cellNumber: 134, isSafe: true, safeColor: '#f7e76b' },
    { cellNumber: 133 },
    { cellNumber: 132 },
    { cellNumber: 131 },
    { cellNumber: 130 },
    { cellNumber: 144 },
    { cellNumber: 159 },
    { cellNumber: 174 },
    { cellNumber: 189, isSafe: true },
    { cellNumber: 204 },
    { cellNumber: 219 },
    { cellNumber: 218, finishPath: LUDO_FINISH_PATH['blue'] },
    { cellNumber: 217 },
    { cellNumber: 202, isSafe: true, safeColor: '#6ba8ff' },
    { cellNumber: 187 },
    { cellNumber: 172 },
    { cellNumber: 157 },
    { cellNumber: 142 },
    { cellNumber: 126 },
    { cellNumber: 125 },
    { cellNumber: 124 },
    { cellNumber: 123, isSafe: true },
    { cellNumber: 122 },
    { cellNumber: 121 },
    { cellNumber: 106, finishPath: LUDO_FINISH_PATH['red'] },
    { cellNumber: 91 },
    { cellNumber: 92, isSafe: true, safeColor: '#ff6b6b' },
    { cellNumber: 93 },
    { cellNumber: 94 },
    { cellNumber: 95 },
    { cellNumber: 96 },
    { cellNumber: 82 },
    { cellNumber: 67 },
    { cellNumber: 52 },
    { cellNumber: 37, isSafe: true },
    { cellNumber: 22 },
];