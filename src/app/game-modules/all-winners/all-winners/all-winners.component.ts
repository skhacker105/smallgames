import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IGameInfo, IGameWinner } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';

@Component({
  selector: 'app-all-winners',
  templateUrl: './all-winners.component.html',
  styleUrls: ['./all-winners.component.scss']
})
export class AllWinnersComponent implements OnInit {
  @ViewChild('filterDialog') filterDialog!: TemplateRef<any>;

  winners: IGameWinner[] = [];
  games: IGameInfo[] = [];
  selectedGames: Set<string> = new Set();
  tempSelectedGames: Set<string> = new Set(); // Temporary selection for dialog
  allGames: Set<string> = new Set();
  areFiltersChanged: boolean = false; // Track if filters are changed

  constructor(private gameDashboardService: GameDashboardService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.winners = this.gameDashboardService.getAllWinners();
    this.selectedGames = new Set<string>(this.winners.map((winner) => winner.key));
    this.allGames = new Set<string>(this.selectedGames);
    this.games = this.gameDashboardService.games.filter(game => this.selectedGames.has(game.key));
  }

  get selectedFilters(): string {
    if (this.selectedGames.size === this.allGames.size) return 'ALL Games';
    else if (this.selectedGames.size === 0) return 'No Games Selected';

    const game = this.games.find(g => g.key === [...this.selectedGames.values()][0]);
    return game ? game.name : 'No Game Name Found';
  }

  get moreFiltersCount(): number {
    return this.selectedGames.size === this.allGames.size
      || this.selectedGames.size === 0
      || this.selectedGames.size === 1
      ? 0
      : this.selectedGames.size - 1;
  }

  get moreFilters(): string {
    const pendingGames = this.games.filter(g => this.selectedGames.has(g.key) && g.key !== [...this.selectedGames.values()][0]);
    return pendingGames.map(g => g.name).join(', ');
  }

  get filteredWinners(): IGameWinner[] {
    return this.winners.filter((winner) => this.selectedGames.has(winner.key));
  }

  getGame(winner: IGameWinner): IGameInfo | undefined {
    return this.gameDashboardService.games.find(game => game.key === winner.key);
  }

  getAllPlayerNames(winner: IGameWinner): string {
    return winner.winners?.map(w => w.name).join(', ') ?? 'all players';
  }

  openFilterDialog(): void {
    // Initialize temporary selection with current selected games
    this.tempSelectedGames = new Set(this.selectedGames);
    this.areFiltersChanged = false; // Reset filter change tracking
    this.dialog.open(this.filterDialog, {
      width: '400px',
      panelClass: 'custom-dialog-container' // Add custom class for styling
    });
  }

  closeFilterDialog(): void {
    this.dialog.closeAll();
  }

  toggleTempGameSelection(gameKey: string): void {
    if (this.tempSelectedGames.has(gameKey)) {
      this.tempSelectedGames.delete(gameKey);
    } else {
      this.tempSelectedGames.add(gameKey);
    }
    this.checkIfFiltersChanged(); // Check if filters are changed
  }

  selectAllFilters(): void {
    this.tempSelectedGames = new Set(this.allGames);
    this.checkIfFiltersChanged(); // Check if filters are changed
  }

  clearAllFilters(): void {
    this.tempSelectedGames.clear();
    this.checkIfFiltersChanged(); // Check if filters are changed
  }

  applyFilters(): void {
    this.selectedGames = new Set(this.tempSelectedGames);
    this.dialog.closeAll();
  }

  checkIfFiltersChanged(): void {
    // Compare tempSelectedGames with selectedGames to determine if changes were made
    this.areFiltersChanged =
      this.tempSelectedGames.size !== this.selectedGames.size ||
      [...this.tempSelectedGames].some(key => !this.selectedGames.has(key));
  }
}