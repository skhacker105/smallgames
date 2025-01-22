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
    }
];
