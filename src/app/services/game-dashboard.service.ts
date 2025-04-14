import { Injectable } from '@angular/core';
import { IGameInfo, IGameWinner, IPlayer } from '../interfaces';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';

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
    },
    {
      key: 'chess',
      name: 'Chess',
      image: 'assets/chess_icon.png',
      route: 'chess',
      settingsIconNeeded: false
    },
    {
      key: 'hanoiOfTower',
      name: 'Hanoi Tower',
      image: 'assets/hanoioftower.png',
      route: 'hanoi-tower',
      settingsIconNeeded: false
    },
    {
      key: 'patternPuzzle',
      name: 'Puzzle',
      image: 'assets/numPuzzle.png',
      route: 'pattern-puzzle',
      settingsIconNeeded: false
    },
    {
      key: 'game2048',
      name: '2048',
      image: 'assets/2048.png',
      route: 'game-2048',
      settingsIconNeeded: false
    },
    {
      key: 'play-card-memorize',
      name: 'Memory',
      image: 'assets/playCardMemorize.png',
      route: 'playCardMemorize',
      settingsIconNeeded: false
    },
    // {
    //   key: 'connectingDots',
    //   name: 'Dots',
    //   image: 'assets/connectingDots.png',
    //   route: 'connecting-dots',
    //   settingsIconNeeded: false
    // }
    {
      key: 'imagePuzzle',
      name: 'Image Puzzle',
      image: 'assets/playCardMemorize.png',
      route: 'image-puzzle',
      settingsIconNeeded: false
    },
  ];
  allWinnersKey = 'allWinner';

  selectedGame = new BehaviorSubject<IGameInfo | undefined>(undefined);

  constructor(
    private router: Router,
    private userService: UserService) {

    this.selectedGame.subscribe({
      next: gameInfo => {
        if (gameInfo) this.router.navigateByUrl(gameInfo.route);
        else this.router.navigateByUrl('');
      }
    });
  }

  saveGameState(state: any, gameKey?: string): void {
    if (!this.selectedGame.value) return;

    if (state)
      localStorage.setItem((gameKey ?? this.selectedGame.value.key), JSON.stringify(state));
    else
      localStorage.removeItem((gameKey ?? this.selectedGame.value.key));
  }

  loadGameState(gameKey?: string): any {
    if (!this.selectedGame.value) return null;

    const state = localStorage.getItem(gameKey ?? this.selectedGame.value.key);
    return state ? JSON.parse(state) : null;
  }

  saveGameWinner(winnerPlayer: IPlayer | IPlayer[], isDraw: boolean = false): void {
    if (!this.selectedGame.value) return;

    const allSavedWinners = this.getAllWinners();
    allSavedWinners.push({
      key: this.selectedGame.value?.key,
      winner: !Array.isArray(winnerPlayer) ? winnerPlayer : undefined,
      winners: Array.isArray(winnerPlayer) ? winnerPlayer : undefined,
      isDraw,
      winDate: new Date()
    });
    localStorage.setItem(this.allWinnersKey, JSON.stringify(allSavedWinners));
  }

  saveGameScore(score: string, gameLevel?: string): void {
    if (!this.selectedGame.value || !this.userService.me) return;

    const allSavedWinners = this.getAllWinners();
    allSavedWinners.push({
      key: this.selectedGame.value?.key,
      score,
      gameLevel,
      winDate: new Date()
    });
    localStorage.setItem(this.allWinnersKey, JSON.stringify(allSavedWinners));
  }

  saveGameDuration(gameDuration: number, gameLevel?: string): void {
    if (!this.selectedGame.value || !this.userService.me) return;

    const allSavedWinners = this.getAllWinners();
    allSavedWinners.push({
      key: this.selectedGame.value?.key,
      gameDuration,
      gameLevel,
      winDate: new Date()
    });
    localStorage.setItem(this.allWinnersKey, JSON.stringify(allSavedWinners));
  }

  getAllWinners(): IGameWinner[] {
    const savedWInners = localStorage.getItem(this.allWinnersKey);
    if (!savedWInners) return [] as IGameWinner[];

    return JSON.parse(savedWInners);
  }
}
