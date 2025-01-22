import { Component } from '@angular/core';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { IGameInfo } from '../../../interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {


  constructor(public gameDashboardService: GameDashboardService) {
    this.gameDashboardService.selectedGame.next(undefined)
  }

  handleGameIconClick(gameInfo: IGameInfo): void {
    this.gameDashboardService.selectedGame.next(gameInfo)
  }
}
