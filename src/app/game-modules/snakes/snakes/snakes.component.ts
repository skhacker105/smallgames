import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';

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
export class SnakesComponent extends BaseComponent {
  gridSize = Math.floor(screen.width / 20);
  intervalId: any;

  snake: { x: number; y: number }[] = [{ x: 10, y: 10 }];
  direction = 'RIGHT';
  food = { x: 15, y: 15 };
  score = 0;
  speed = 500;
  maxInterval = 1000;

  constructor(private gameDashboardService: GameDashboardService) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.startGame();
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
  }

  resetGame(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'RIGHT';
    this.food = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
    this.score = 0;
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
      alert('Game Over!');
      this.resetGame();
      return;
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
  
  checkWinner(): boolean {
    return true;
  }
}
