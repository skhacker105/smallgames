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
        path: 'pattern-puzzle',
        loadChildren: () => import('./game-modules/pattern-puzzle/pattern-puzzle.module').then(module => module.PatternPuzzleModule)
    },
    {
        path: 'hanoi-tower',
        loadChildren: () => import('./game-modules/hanoi-of-tower/hanoi-of-tower.module').then(module => module.HanoiOfTowerModule)
    },
    {
        path: 'game-2048',
        loadChildren: () => import('./game-modules/game2048/game2048.module').then(module => module.Game2048Module),
    },
    {
        path: 'play-card-memorize',
        loadChildren: () => import('./game-modules/play-card-memorize/play-card-memorize.module').then(module => module.PlayCardMemorizeModule),
    },
    {
        path: 'connecting-dots',
        loadChildren: () => import('./game-modules/connecting-dots/connecting-dots.module').then(module => module.ConnectingDotsModule),
    },
    {
        path: 'image-puzzle',
        loadChildren: () => import('./game-modules/image-puzzle/image-puzzle.module').then(module => module.ImagePuzzleModule),
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
