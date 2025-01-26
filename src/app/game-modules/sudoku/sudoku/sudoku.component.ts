import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { GameDashboardService } from '../../../services/game-dashboard.service';

interface ICell {
  row: number;
  col: number;
}

@Component({
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  styleUrl: './sudoku.component.scss'
})
export class SudokuComponent extends BaseComponent {
  board: number[][] = [];
  solution: number[][] = [];
  maxLevel = 10;
  levels = new Array(this.maxLevel).fill(0).map((x, i) => i + 1);
  level: number = 5;
  size: number = 9;
  prefilledCells: ICell[] = [];
  winner = false;

  constructor(private gameDashboardService: GameDashboardService) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  loadGameState(): void {
    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      const { board, solution, level, size, prefilledCells, winner } = savedState;
      this.board = board;
      this.solution = solution;
      this.level = level;
      this.size = size;
      this.prefilledCells = prefilledCells;
      this.winner = winner;
    } else
      this.generateNewGame();
  }

  saveGameState(): void {
    const state = {
      board: this.board,
      solution: this.solution,
      level: this.level,
      size: this.size,
      prefilledCells: this.prefilledCells,
      winner: this.winner
    };
    this.gameDashboardService.saveGameState(state);
  }

  resetGame(): void {
    this.winner = false;
    this.board.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (this.isPrefilled(i, j)) this.board[i][j] = this.solution[i][j];
        else this.board[i][j] = 0;
      })
    });
    this.saveGameState();
  }

  generateNewGame(): void {
    const { puzzle, solution } = this.createSudoku(this.level);
    this.board = puzzle;
    this.solution = solution;
  }

  onLevelChange(newLevel: number): void {
    this.level = newLevel;
    this.resetGame();
    this.generateNewGame();
  }

  createSudoku(level: number): { puzzle: number[][]; solution: number[][] } {
    const solution = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    const puzzle = Array.from({ length: this.size }, () => Array(this.size).fill(0));

    // Generate a valid Sudoku solution
    const fillGrid = (row: number, col: number): boolean => {
      if (row === this.size) return true; // Reached the end of the grid
      const nextRow = col === this.size - 1 ? row + 1 : row;
      const nextCol = (col + 1) % this.size;

      const numbers = Array.from({ length: this.size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      for (const num of numbers) {
        if (this.isValidPlacement(solution, row, col, num)) {
          solution[row][col] = num;
          if (fillGrid(nextRow, nextCol)) return true;
          solution[row][col] = 0; // Backtrack
        }
      }
      return false;
    };

    fillGrid(0, 0);

    // Adjust initial filled cells based on difficulty level
    const cellsToFill = Math.max(20, 81 - level * 8); // Number of cells to prefill
    this.prefilledCells = [];
    const levelLimit = level >= 1 && level <= 4 ? 0.8 : level > 7 && level <= 8 ? 0.5 : 0.3
    puzzle.forEach((row, i) => {
      row.forEach((_, j) => {
        if (Math.random() < levelLimit) {
          puzzle[i][j] = solution[i][j];
          this.prefilledCells.push({ row: i, col: j });
        }
      });
    });

    return { puzzle, solution };
  }

  private isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
    // Check the row
    if (board[row].includes(num)) return false;

    // Check the column
    for (let i = 0; i < this.size; i++) {
      if (board[i][col] === num) return false;
    }

    // Check the 3x3 subgrid
    const subgridSize = Math.sqrt(this.size);
    const startRow = Math.floor(row / subgridSize) * subgridSize;
    const startCol = Math.floor(col / subgridSize) * subgridSize;
    for (let i = 0; i < subgridSize; i++) {
      for (let j = 0; j < subgridSize; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }

    return true;
  }
  checkWinner(): boolean {
    return this.solution.join(',') === this.board.join(',');
  }

  getCellCLass(i: number, j: number): string {
    const row = i % 3;
    const col = j % 3;
    let className = '';

    // Set Border
    switch (row.toString() + col.toString()) {

      case '00': className = 'lt'; break;
      case '01': className = 'top'; break;
      case '02': className = 'rt'; break;

      case '10': className = 'left'; break;
      case '11': className = 'center'; break;
      case '12': className = 'right'; break;

      case '20': className = 'bl'; break;
      case '21': className = 'bottom'; break;
      case '22': className = 'br'; break;
    }

    if (this.winner) return className += ' winner'

    // Set Prefilled Class
    if (this.isPrefilled(i, j)) className += ' prefilled';
    // Set Manual User Fill Class
    else if (this.board[i][j] > 0) {
      if (this.isDuplicate(i, j, this.board[i][j])) className += ' duplicate'
      else className += ' user-fill';
    }

    return className;
  }

  isDuplicate(row: number, col: number, cellValue: number): boolean {
    const i = row % 3;
    const j = col % 3;
    const rs = row - i;
    const cs = col - j;
    for (let r = rs; r <= rs + 2; r++) {
      for (let c = cs; c <= cs + 2; c++) {
        if (r === row && c === col) continue;

        const value = this.board[r][c];
        if (value === cellValue) return true;
      }
    }
    return false;
  }

  isPrefilled(i: number, j: number): boolean {
    return this.prefilledCells.some(cell => cell.row === i && cell.col === j);
  }

  handleInputChange(i: number, j: number, e: any) {
    const val = e.target.value;

    if (!val || isNaN(+val)) {
      this.board[i][j] = 0;
      return;
    }

    const num = val.toString().replace('0', '');
    if (!num || +num < 0 || +num > 9)
      this.board[i][j] = 0;
    else
      this.board[i][j] = +num;
    if (this.checkWinner()) this.winner = true;
    this.saveGameState();
  }

  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.select(); // Select the text inside the textbox
  }
}
