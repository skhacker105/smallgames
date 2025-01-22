import { Injectable } from '@angular/core';
import { IGameInfo } from '../interfaces';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameDashboardService {

  games: IGameInfo[] = [
    {
      key: 'tictactoe',
      name: 'Tic Tac Toe',
      image: '',
      route: 'tictactoe',
      settingsIconNeeded: false
    },
    {
      key: 'snakes',
      name: 'Snakes',
      image: '',
      route: 'snakes',
      settingsIconNeeded: true
    },
    {
      key: 'sudoku',
      name: 'Sudoku',
      image: '',
      route: 'sudoku',
      settingsIconNeeded: true
    },
    {
      key: 'snakeNLadder',
      name: 'Snake And Ladder',
      image: '',
      route: 'snakeNLadder',
      settingsIconNeeded: true
    },
    {
      key: 'ludo',
      name: 'Ludo',
      image: '',
      route: 'ludo',
      settingsIconNeeded: true
    }
  ];

  selectedGame = new BehaviorSubject<IGameInfo | undefined>(undefined);

  constructor(private router: Router) {
    this.selectedGame.subscribe({
      next: gameInfo => {
        if (gameInfo) this.router.navigateByUrl(gameInfo.route);
        else this.router.navigateByUrl('');
      }
    })
  }

  saveGameState(state: any): void {
    if (!this.selectedGame.value) return;

    localStorage.setItem(this.selectedGame.value.key, JSON.stringify(state));
  }

  loadGameState(): any {
    if (!this.selectedGame.value) return null;

    const state = localStorage.getItem(this.selectedGame.value.key);
    return state ? JSON.parse(state) : null;
  }
}
