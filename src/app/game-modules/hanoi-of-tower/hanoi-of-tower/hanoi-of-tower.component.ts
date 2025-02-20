import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hanoi-of-tower',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hanoi-of-tower.component.html',
  styleUrl: './hanoi-of-tower.component.scss'
})
export class HanoiOfTowerComponent {
  towers: number[][] = [[], [], []];
  startTower: number = 0;
  endTower: number = 2;
  selectedDisk: number | null = null;
  selectedTower: number | null = null;
  gameOver: boolean = false;
  numberOfDisks: number = 3;
  errorMessage: string | null = null; // Added for error messages

  constructor() {
    this.resetGame();
  }

  resetGame(): void {
    this.towers = [[], [], []];
    this.startTower = Math.floor(Math.random() * 3);
    this.endTower = Math.floor(Math.random() * 3);
    while (this.endTower === this.startTower) {
      this.endTower = Math.floor(Math.random() * 3);
    }
    for (let i = this.numberOfDisks; i > 0; i--) {
      this.towers[this.startTower].push(i);
    }
    this.selectedDisk = null;
    this.selectedTower = null;
    this.gameOver = false;
    this.errorMessage = null; // Reset error message
  }

  handleTowerClick(towerIndex: number): void {
    if (this.gameOver) return;

    if (this.selectedDisk === null) {
      // Select the top disk from the clicked tower
      if (this.towers[towerIndex].length > 0) {
        this.selectedDisk = this.towers[towerIndex][this.towers[towerIndex].length - 1];
        this.selectedTower = towerIndex;
        this.errorMessage = null; // Reset error message
      }
    } else if (this.selectedTower === towerIndex) {
      // Deselect the disk if the same tower is clicked again
      this.selectedDisk = null;
      this.selectedTower = null;
      this.errorMessage = null; // Reset error message
    } else {
      // Move the selected disk to the clicked tower
      if (this.isValidMove(towerIndex)) {
        this.towers[towerIndex].push(this.selectedDisk);
        this.towers[this.selectedTower!].pop();
        this.selectedDisk = null;
        this.selectedTower = null;
        this.errorMessage = null; // Reset error message
        this.checkGameOver();
      } else {
        // Invalid move, show error message
        this.errorMessage = 'Invalid move! A larger disk cannot be placed on a smaller one.';
      }
    }
  }

  isValidMove(towerIndex: number): boolean {
    const targetTower = this.towers[towerIndex];
    return targetTower.length === 0 || this.selectedDisk! < targetTower[targetTower.length - 1];
  }

  checkGameOver(): void {
    if (this.towers[this.endTower].length === this.numberOfDisks) {
      this.gameOver = true;
    }
  }

  getDiskStyle(disk: number): any {
    const width = 50 + disk * 30;
    return {
      width: `${width}px`,
      backgroundColor: `hsl(${disk * 30}, 70%, 50%)`
    };
  }

  isSelectedDisk(disk: number): boolean {
    return this.selectedDisk === disk;
  }

  saveGameState(): void {
    const gameState = {
      towers: this.towers,
      startTower: this.startTower,
      endTower: this.endTower,
      selectedDisk: this.selectedDisk,
      selectedTower: this.selectedTower,
      gameOver: this.gameOver,
      numberOfDisks: this.numberOfDisks
    };
    localStorage.setItem('hanoiGameState', JSON.stringify(gameState));
    alert('Game saved successfully!');
  }

  loadGameState(): void {
    const savedState = localStorage.getItem('hanoiGameState');
    if (savedState) {
      const gameState = JSON.parse(savedState);
      this.towers = gameState.towers;
      this.startTower = gameState.startTower;
      this.endTower = gameState.endTower;
      this.selectedDisk = gameState.selectedDisk;
      this.selectedTower = gameState.selectedTower;
      this.gameOver = gameState.gameOver;
      this.numberOfDisks = gameState.numberOfDisks;
      this.errorMessage = null; // Reset error message
      alert('Game loaded successfully!');
    } else {
      alert('No saved game found!');
    }
  }
}
