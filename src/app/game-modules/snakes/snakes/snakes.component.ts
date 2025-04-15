import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { InfoComponent } from '../../../components/info/info.component';
import { IGameMultiPlayerConnection, IInfo, IPlayer } from '../../../interfaces';
import { Observable, take } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { generateHexId } from '../../../utils/support.utils';

interface SnakeGameState {
  snake: { x: number; y: number }[];
  direction: string;
  food: { x: number; y: number };
  score: number;
}

@Component({
  selector: 'app-snakes',
  templateUrl: './snakes.component.html',
  styleUrl: './snakes.component.scss'
})
export class SnakesComponent extends BaseComponent implements OnInit, OnDestroy {

  boxWidth = 20;
  gridSize = Math.floor(screen.width / this.boxWidth) - 2;
  gridTemplateColumns = `repeat(${this.gridSize}, ${Math.floor(95 / this.gridSize)}%)`; // Dynamically set grid template


  intervalId: any;

  snake: { x: number; y: number }[] = [{ x: 10, y: 10 }];
  direction = 'RIGHT';
  food = { x: 15, y: 15 };
  score = 0;
  speed = 500;
  maxInterval = 1000;

  constructor(
    gameDashboardService: GameDashboardService,
    private userService: UserService,
    dialog: MatDialog,
    multiPlayerService: MultiPlayerService
  ) {
    super(gameDashboardService, multiPlayerService, dialog);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // this.startGame();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopGame();
  }

  getGameState() {
    return {
      snake: this.snake,
      direction: this.direction,
      food: this.food,
      score: this.score,
      gameId: this.gameId
    };
  }

  setGameState(savedState: any): void {
    this.snake = savedState.snake;
    this.direction = savedState.direction;
    this.food = savedState.food;
    this.score = savedState.score;
    this.gameId = savedState.gameId ?? generateHexId(16);
  }

  loadGameState(): void {
    const state: SnakeGameState = this.gameDashboardService.loadGameState();
    if (state) {
      this.setGameState(state);
    }
  }

  saveGameState(): void {
    const state: SnakeGameState = this.getGameState();
    this.gameDashboardService.saveGameState(state);
  }

  startGame(): void {
    this.intervalId = setInterval(() => this.updateGame(), (this.maxInterval - this.speed));
  }

  stopGame(): void {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  saveGameScore(score: number): void {
    if (!this.userService.me) return;

    this.gameDashboardService.saveGameScore(score.toString());
  }

  resetGame(): void {
    this.gameId = generateHexId(16);
    this.stopGame();
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'RIGHT';
    this.food = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
    this.score = 0;
    this.intervalId = undefined;
    this.saveGameState();
  }
  
  setPlayers(): Observable<IPlayer[]> | undefined {
    throw new Error('Method not implemented.');
  }
  setLocalPlayers(players: IPlayer[]): void {
    throw new Error('Method not implemented.');
  }
  setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void {
    throw new Error('Method not implemented.');
  }
  setPlayersAndStartGame(): void {
    throw new Error('Method not implemented.');
  }

  updateGame(): void {
    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'UP':
        head.y--;
        break;
      case 'DOWN':
        head.y++;
        break;
      case 'LEFT':
        head.x--;
        break;
      case 'RIGHT':
        head.x++;
        break;
    }

    // Check collision with walls or itself
    if (
      head.x < 0 ||
      head.x >= this.gridSize ||
      head.y < 0 ||
      head.y >= this.gridSize ||
      this.snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      this.saveGameScore(this.score);
      this.stopGame();
      // alert('Game Over!');
      this.informGameOver().then(() => this.resetGame());
    }

    this.snake.unshift(head);

    // Check collision with food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize),
      };
    } else {
      this.snake.pop();
    }

    this.saveGameState();
  }

  informGameOver() {
    return new Promise<void>((resolve, reject) => {
      const ref = this.dialog.open(InfoComponent, {
        data: {
          message: 'Game Over!'
        } as IInfo,
        disableClose: true
      });

      ref.afterClosed().pipe(take(1))
        .subscribe(() => resolve());
    });
  }

  changeDirection(newDirection: string): void {
    const oppositeDirections: { [key: string]: string } = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    if (newDirection !== oppositeDirections[this.direction]) {
      this.direction = newDirection;
    }
  }

  isSnakeCell(i: number): boolean {
    return this.snake.some(segment => segment.x === i % this.gridSize && segment.y === Math.floor(i / this.gridSize))
  }

  isfoodCell(i: number): boolean {
    return this.food.x === i % this.gridSize && this.food.y === Math.floor(i / this.gridSize)
  }

  isSnakeHead(i: number): boolean {
    return this.snake[0].x === i % this.gridSize && this.snake[0].y === Math.floor(i / this.gridSize)
  }

  checkWinner(): boolean {
    return true;
  }
}
