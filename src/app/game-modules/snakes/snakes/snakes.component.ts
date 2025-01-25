import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { InfoComponent } from '../../../components/info/info.component';
import { IInfo } from '../../../interfaces';
import { take } from 'rxjs';

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
    private gameDashboardService: GameDashboardService,
    private dialog: MatDialog
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // this.startGame();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopGame();
  }

  loadGameState(): void {
    const state: SnakeGameState = this.gameDashboardService.loadGameState();
    if (state) {
      this.snake = state.snake;
      this.direction = state.direction;
      this.food = state.food;
      this.score = state.score;
    }
  }

  saveGameState(): void {
    const state: SnakeGameState = {
      snake: this.snake,
      direction: this.direction,
      food: this.food,
      score: this.score,
    };
    this.gameDashboardService.saveGameState(state);
  }

  startGame(): void {
    this.intervalId = setInterval(() => this.updateGame(), (this.maxInterval - this.speed));
  }

  stopGame(): void {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  resetGame(): void {
    this.stopGame();
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'RIGHT';
    this.food = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
    this.score = 0;
    this.intervalId = undefined;
    this.saveGameState();
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
        } as IInfo
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
