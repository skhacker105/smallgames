import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./game-modules/home/home.module').then(module => module.HomeModule)
    },
    {
        path: 'tictactoe',
        loadChildren: () => import('./game-modules/tic-tac-toe/tic-tac-toe.module').then(module => module.TicTacToeModule)
    },
    {
        path: 'snakes',
        loadChildren: () => import('./game-modules/snakes/snakes.module').then(module => module.SnakesModule)
    },
    {
        path: 'sudoku',
        loadChildren: () => import('./game-modules/sudoku/sudoku.module').then(module => module.SudokuModule)
    },
    {
        path: 'snakeNLadder',
        loadChildren: () => import('./game-modules/snake-nladder/snake-nladder.module').then(module => module.SnakeNLadderModule)
    },
    {
        path: 'ludo',
        loadChildren: () => import('./game-modules/ludo/ludo.module').then(module => module.LudoModule)
    }
];
