import { Component, OnInit } from '@angular/core';
import { IGameInfo, IGameWinner } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';

@Component({
  selector: 'app-all-winners',
  templateUrl: './all-winners.component.html',
  styleUrl: './all-winners.component.scss'
})
export class AllWinnersComponent implements OnInit {

  winners: IGameWinner[] = [];
  games: (IGameInfo | undefined)[] = [];
  selectedGames: Set<string> = new Set();

  constructor(private gameDashboardService: GameDashboardService) { }

  ngOnInit(): void {
    this.winners = this.gameDashboardService.getAllWinners();
    this.selectedGames = new Set(this.winners.map((winner) => winner.key)); 
    this.games = this.gameDashboardService.games.filter(game => this.selectedGames.has(game.key))
  }

  getGameName(winner: IGameWinner): string | undefined {
    return this.getGame(winner)?.name
  }

  getGame(winner: IGameWinner): IGameInfo | undefined {
    return this.gameDashboardService.games.find(game => game.key === winner.key)
  }

  toggleGameSelection(gameKey: string) {
    if (this.selectedGames.has(gameKey)) {
      this.selectedGames.delete(gameKey);
    } else {
      this.selectedGames.add(gameKey);
    }
  }

  get filteredWinners(): IGameWinner[] {
    return this.winners.filter((winner) => this.selectedGames.has(winner.key));
  }

  getAllPlayerNames(winner: IGameWinner) {
    return winner.winners?.map(w => w.name).join(',')
  }
}
