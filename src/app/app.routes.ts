import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        loadChildren: () => import('./game-modules/home/home.module').then(module => module.HomeModule),
        data: {
            title: 'Small Games'
        }
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
    },
    {
        path: 'chess',
        loadChildren: () => import('./game-modules/chess/chess.module').then(module => module.ChessModule)
    },
    {
        path: 'hanoiTower',
        loadChildren: () => import('./game-modules/hanoi-of-tower/hanoi-of-tower.module').then(module => module.HanoiOfTowerModule)
    },
    {
        path: 'winners',
        loadChildren: () => import('./game-modules/all-winners/all-winners.module').then(module => module.AllWinnersModule),
        data: {
            title: 'Winners List'
        }
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
