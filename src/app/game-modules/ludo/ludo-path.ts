
import { LUDO_COLOR } from '../../config';
import { IPathCell } from '../../interfaces';


export const LUDO_FINISH_PATH: { [color: string]: IPathCell[] } = {
    'green': [
        { cellNumber: 23, backgroundColor: '#6bcf6b', isFinishingPath: true },
        { cellNumber: 38, backgroundColor: '#6bcf6b', isFinishingPath: true },
        { cellNumber: 53, backgroundColor: '#6bcf6b', isFinishingPath: true },
        { cellNumber: 68, backgroundColor: '#6bcf6b', isFinishingPath: true },
        { cellNumber: 83, backgroundColor: '#6bcf6b', isFinishingPath: true }
    ],
    'yellow': [
        { cellNumber: 119, backgroundColor: '#f7e76b', isFinishingPath: true },
        { cellNumber: 118, backgroundColor: '#f7e76b', isFinishingPath: true },
        { cellNumber: 117, backgroundColor: '#f7e76b', isFinishingPath: true },
        { cellNumber: 116, backgroundColor: '#f7e76b', isFinishingPath: true },
        { cellNumber: 115, backgroundColor: '#f7e76b', isFinishingPath: true }
    ],
    'blue': [
        { cellNumber: 203, backgroundColor: '#6ba8ff', isFinishingPath: true },
        { cellNumber: 188, backgroundColor: '#6ba8ff', isFinishingPath: true },
        { cellNumber: 173, backgroundColor: '#6ba8ff', isFinishingPath: true },
        { cellNumber: 158, backgroundColor: '#6ba8ff', isFinishingPath: true },
        { cellNumber: 143, backgroundColor: '#6ba8ff', isFinishingPath: true },
    ],
    'red': [
        { cellNumber: 107, backgroundColor: '#ff6b6b', isFinishingPath: true },
        { cellNumber: 108, backgroundColor: '#ff6b6b', isFinishingPath: true },
        { cellNumber: 109, backgroundColor: '#ff6b6b', isFinishingPath: true },
        { cellNumber: 110, backgroundColor: '#ff6b6b', isFinishingPath: true },
        { cellNumber: 111, backgroundColor: '#ff6b6b', isFinishingPath: true }
    ]
};

export const LUDO_PATHS: IPathCell[] = [
    { cellNumber: 7 },
    { cellNumber: 8, finishPath: LUDO_FINISH_PATH['green'], color: 'green' },
    { cellNumber: 9 },
    { cellNumber: 24, isSafe: true, backgroundColor: '#6bcf6b', color: 'green', isStart: true },
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
    { cellNumber: 120, finishPath: LUDO_FINISH_PATH['yellow'], color: 'yellow' },
    { cellNumber: 135 },
    { cellNumber: 134, isSafe: true, backgroundColor: '#f7e76b', color: 'yellow', isStart: true },
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
    { cellNumber: 218, finishPath: LUDO_FINISH_PATH['blue'], color: 'blue' },
    { cellNumber: 217 },
    { cellNumber: 202, isSafe: true, backgroundColor: '#6ba8ff', color: 'blue', isStart: true },
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
    { cellNumber: 106, finishPath: LUDO_FINISH_PATH['red'], color: 'red' },
    { cellNumber: 91 },
    { cellNumber: 92, isSafe: true, backgroundColor: '#ff6b6b', color: 'red', isStart: true },
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

export const COLOR_PATHS: { [color in LUDO_COLOR]: IPathCell[] } = {
    'green': createColorPath(24, 8),
    'yellow': createColorPath(134, 120),
    'blue': createColorPath(202, 218),
    'red': createColorPath(92, 106),
}


function createColorPath(startCellNumber: number, endCellNumber: number): IPathCell[] {
    const len = LUDO_PATHS.length;
    const startIndex = LUDO_PATHS.findIndex(path => path.cellNumber === startCellNumber);
    const endIndex = LUDO_PATHS.findIndex(path => path.cellNumber === endCellNumber);

    return LUDO_PATHS.slice(startIndex, len)
        .concat(LUDO_PATHS.slice(0, endIndex + 1))
        .concat(LUDO_PATHS[endIndex].finishPath ?? [])
}