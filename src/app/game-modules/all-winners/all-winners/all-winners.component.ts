import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IGameInfo, IGameWinner } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';

interface IGameWinnerInfo extends IGameWinner, IGameInfo {}

@Component({
  selector: 'app-all-winners',
  templateUrl: './all-winners.component.html',
  styleUrls: ['./all-winners.component.scss']
})
export class AllWinnersComponent implements OnInit {

  @ViewChild('filterDialog') filterDialog!: TemplateRef<any>;

  winners: IGameWinnerInfo[] = [];
  games: IGameInfo[] = [];
  selectedGames: Set<string> = new Set();
  tempSelectedGames: Set<string> = new Set(); // Temporary selection for dialog
  allGames: Set<string> = new Set();
  areFiltersChanged: boolean = false; // Track if filters are changed

  sortCriteria: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(private gameDashboardService: GameDashboardService, private dialog: MatDialog) { }

  ngOnInit(): void {
    const winners = this.gameDashboardService.getAllWinners();
    this.winners = winners.map(w => {
      const gameInfo = this.gameDashboardService.games.find(g => g.key === w.key) ?? {};
      return {...w,...gameInfo} as IGameWinnerInfo;
    });

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

  get filteredWinners(): IGameWinnerInfo[] {
    let winners = this.winners.filter((winner) => this.selectedGames.has(winner.key));
    return this.sortWinners(winners);
  }

  getAllPlayerNames(winner: IGameWinnerInfo): string {
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

  sortWinners(winners: IGameWinnerInfo[]): IGameWinnerInfo[] {
    return winners.sort((a, b) => {
      let valueA, valueB;

      switch (this.sortCriteria) {
        case 'gameName':
          valueA = a.name ?? '';
          valueB = b.name ?? '';
          break;
        case 'date':
          valueA = new Date(a.winDate).getTime();
          valueB = new Date(b.winDate).getTime();
          break;
        case 'score':
          valueA = a.score ?? 0;
          valueB = b.score ?? 0;
          break;
        case 'duration':
          valueA = a.gameDuration ?? 0;
          valueB = b.gameDuration ?? 0;
          break;
        case 'level':
          valueA = a.gameLevel ?? '';
          valueB = b.gameLevel ?? '';
          break;
        default:
          valueA = '';
          valueB = '';
      }

      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  shouldShowScoreSorting(): boolean {
    return this.filteredWinners.every(winner => winner.score !== undefined);
  }

  shouldShowDurationSorting(): boolean {
    return this.filteredWinners.every(winner => winner.gameDuration !== undefined);
  }

  shouldShowLevelSorting(): boolean {
    return this.filteredWinners.every(winner => winner.gameLevel !== undefined);
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applySorting();
  }

  applySorting(): void {
    // Trigger change detection
    // this.filteredWinners = [...this.filteredWinners];
  }
}