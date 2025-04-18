import { Component } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { BaseComponent } from '../../../components/base.component';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { MultiPlayerService } from '../../../services/multi-player.service';
import { MatDialog } from '@angular/material/dialog';
import { IGameMultiPlayerConnection, IPlayer } from '../../../interfaces';

@Component({
  selector: 'app-hanoi-of-tower',
  templateUrl: './hanoi-of-tower.component.html',
  styleUrl: './hanoi-of-tower.component.scss'
})
export class HanoiOfTowerComponent extends BaseComponent {
  towers: number[][] = [[], [], []];
  startTower: number = 0;
  endTower: number = 2;
  selectedDisk: number | null = null;
  selectedTower: number | null = null;
  gameOver: boolean = false;
  numberOfDisks: number = 3;
  numberOfTowers: number = 3;
  errorMessage: string | null = null;
  levels: number[] = [1, 2, 3, 4, 5]; // Levels 1 to 5
  diskSizeMultiplier = 10;
  selectedLevel = 1;
  timeSpent = 0;

  gameOverSubject = new Subject<boolean>();

  constructor(gameDashboardService: GameDashboardService,
    multiPlayerService: MultiPlayerService, dialog: MatDialog) {
    super(gameDashboardService, multiPlayerService, dialog)
  }

  resetGame(): void {
    this.gameOverSubject.next(true);
    this.towers = Array.from({ length: this.numberOfTowers }, () => []);
    this.startTower = Math.floor(Math.random() * this.numberOfTowers);
    this.endTower = Math.floor(Math.random() * this.numberOfTowers);
    while (this.endTower === this.startTower) {
      this.endTower = Math.floor(Math.random() * this.numberOfTowers);
    }
    for (let i = this.numberOfDisks; i > 0; i--) {
      this.towers[this.startTower].push(i);
    }
    this.selectedDisk = null;
    this.selectedTower = null;
    this.gameOver = false;
    this.errorMessage = null;
    this.timeSpent = 0;
    this.saveGameState();
    this.startTimer();
  }

  onLevelChange(event: Event): void {
    const level = +(event.target as HTMLSelectElement).value;
    this.setLevel(level);
    this.resetGame();
  }

  setLevel(level: number): void {
    this.selectedLevel = level;
    switch (level) {
      case 1:
        this.numberOfDisks = 3;
        this.numberOfTowers = 3;
        this.diskSizeMultiplier = 30;
        break;
      case 2:
        this.numberOfDisks = 4;
        this.numberOfTowers = 3;
        this.diskSizeMultiplier = 20;
        break;
      case 3:
        this.numberOfDisks = 5;
        this.numberOfTowers = 3;
        this.diskSizeMultiplier = 20;
        break;
      case 4:
        this.numberOfDisks = 6;
        this.numberOfTowers = 4;
        this.diskSizeMultiplier = 10;
        break;
      case 5:
        this.numberOfDisks = 7;
        this.numberOfTowers = 4;
        this.diskSizeMultiplier = 10;
        break;
      default:
        this.numberOfDisks = 3;
        this.numberOfTowers = 3;
        this.diskSizeMultiplier = 30;
    }
    this.saveGameState();
  }

  startTimer(): void {
    interval(1000).pipe(takeUntil(this.isComponentActive), takeUntil(this.gameOverSubject))
    .subscribe(() => {
      this.timeSpent++;
      this.saveGameState();
    });
  }

  handleTowerClick(towerIndex: number): void {
    if (this.gameOver) return;

    if (this.selectedDisk === null) {
      // Select the top disk from the clicked tower
      if (this.towers[towerIndex].length > 0) {
        this.selectedDisk = this.towers[towerIndex][this.towers[towerIndex].length - 1];
        this.selectedTower = towerIndex;
        this.errorMessage = null;
      }
    } else if (this.selectedTower === towerIndex) {
      // Deselect the disk if the same tower is clicked again
      this.selectedDisk = null;
      this.selectedTower = null;
      this.errorMessage = null;
    } else {
      // Move the selected disk to the clicked tower
      if (this.isValidMove(towerIndex)) {
        this.towers[towerIndex].push(this.selectedDisk);
        this.towers[this.selectedTower!].pop();
        this.selectedDisk = null;
        this.selectedTower = null;
        this.errorMessage = null;
        this.checkGameOver();
      } else {
        // Invalid move, show error message
        this.errorMessage = 'Invalid move! A larger disk cannot be placed on a smaller one.';
      }
    }
    this.saveGameState();
  }

  isValidMove(towerIndex: number): boolean {
    const targetTower = this.towers[towerIndex];
    return targetTower.length === 0 || this.selectedDisk! < targetTower[targetTower.length - 1];
  }

  checkGameOver(): void {
    if (this.towers[this.endTower].length === this.numberOfDisks) {
      this.gameOver = true;
      this.gameOverSubject.next(true);
      this.gameDashboardService.saveGameDuration(this.gameId, this.timeSpent, this.selectedLevel.toString());
    }
  }

  getDiskStyle(disk: number): any {
    const width = disk * this.diskSizeMultiplier;
    return {
      width: `${width}px`,
      backgroundColor: `hsl(${disk * 30}, 70%, 50%)`
    };
  }

  isSelectedDisk(disk: number): boolean {
    return this.selectedDisk === disk;
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

  
  override getGameState() {
    return {
      towers: this.towers,
      startTower: this.startTower,
      endTower: this.endTower,
      selectedDisk: this.selectedDisk,
      selectedTower: this.selectedTower,
      gameOver: this.gameOver,
      numberOfDisks: this.numberOfDisks,
      numberOfTowers: this.numberOfTowers,
      diskSizeMultiplier: this.diskSizeMultiplier,
      selectedLevel: this.selectedLevel,
      timeSpent: this.timeSpent
    };
  }
  override setGameState(gameState: any): void {
    this.towers = gameState.towers;
      this.startTower = gameState.startTower;
      this.endTower = gameState.endTower;
      this.selectedDisk = gameState.selectedDisk;
      this.selectedTower = gameState.selectedTower;
      this.gameOver = gameState.gameOver;
      this.numberOfDisks = gameState.numberOfDisks;
      this.numberOfTowers = gameState.numberOfTowers;
      this.errorMessage = null;
      this.diskSizeMultiplier = gameState.diskSizeMultiplier;
      this.selectedLevel = gameState.selectedLevel
      this.timeSpent = gameState.timeSpent ?? 0;
  }

  saveGameState(): void {
    const gameState = this.getGameState();
    this.gameDashboardService.saveGameState(gameState);
  }

  loadGameState(): void {
    const gameState = this.gameDashboardService.loadGameState();
    if (gameState) {
      this.setGameState(gameState);
      if (!this.gameOver) this.startTimer();
    } else {
      this.setLevel(1);
      this.resetGame();
    }
  }

  checkWinner() {}
}
