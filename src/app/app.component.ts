import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { GameDashboardService } from './services/game-dashboard.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AboutGameComponent } from './components/about-game/about-game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatIconModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Small Games';
  baseTitle = 'Small Games';

  get isHomePage(): boolean {
    return this.title === this.baseTitle;
  }

  constructor(public gameDashboardService: GameDashboardService, public router: Router, private dialog: MatDialog) {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd)) // Filter only NavigationEnd events
    .subscribe(() => {
      this.updateTitleFromRouteData();
    });
  }

  homeClicked() {
    this.gameDashboardService.selectedGame.next(undefined);
  }

  private updateTitleFromRouteData() {
    let route = this.router.routerState.root;

    // Traverse the route tree to find the activated route
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Get the title from the route data
    const routeTitle = route.snapshot.data['title'];

    // Set the title if it exists, otherwise fall back to the default title
    if (routeTitle) {
      this.title = routeTitle;
    } else {
      this.title = this.baseTitle;
    }
  }

  shoAboutInfo() {
    this.dialog.open(AboutGameComponent, {
      width: '80vw',
      disableClose: true, // Prevents closing the dialog by clicking outside or pressing ESC
    });
  }
}
