import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameDashboardService } from './services/game-dashboard.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Small Games';

  constructor(public gameDashboardService: GameDashboardService) { }

  homeClicked() {
    this.gameDashboardService.selectedGame.next(undefined);
  }
}
