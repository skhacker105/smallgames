import { Injectable } from '@angular/core';
import { IGameInfo, IGameWinner, IPlayer } from '../interfaces';
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
      image: 'assets/tictactoe_icon.png',
      route: 'tictactoe',
      settingsIconNeeded: false
    },
    {
      key: 'snakes',
      name: 'Snakes',
      image: 'assets/snakes_icon.png',
      route: 'snakes',
      settingsIconNeeded: false
    },
    {
      key: 'sudoku',
      name: 'Sudoku',
      image: 'assets/sudoku_icon.png',
      route: 'sudoku',
      settingsIconNeeded: false
    },
    {
      key: 'snakeNLadder',
      name: 'Snake N Ladder',
      image: 'assets/snakenladder_icon.png',
      route: 'snakeNLadder',
      settingsIconNeeded: false
    },
    {
      key: 'ludo',
      name: 'Ludo',
      image: 'assets/ludo_icon.png',
      route: 'ludo',
      settingsIconNeeded: false
    }
  ];

  allWinnersKey = 'allWinner';

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

  saveGameWinner(winnerPlayer: IPlayer): void {
    if (!this.selectedGame.value) return;

    const allSavedWinners = this.getAllWinners();
    allSavedWinners.push({
      key: this.selectedGame.value?.key,
      winner: winnerPlayer
    });
    localStorage.setItem(this.allWinnersKey, JSON.stringify(allSavedWinners));
  }

  getAllWinners(): IGameWinner[] {
    const savedWInners = localStorage.getItem(this.allWinnersKey);
    if (!savedWInners) return [] as IGameWinner[];

    return JSON.parse(savedWInners);
  }
}
