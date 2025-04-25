import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { GameDashboardService } from './services/game-dashboard.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AboutGameComponent } from './components/about-game/about-game.component';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { LoggerService } from './services/logger.service';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from './services/user.service';
import { SocketService } from './services/socket.service';
import { MyQRCodeComponent } from './components/my-qrcode/my-qrcode.component';
import { MultiPlayerService } from './services/multi-player.service';
import { DevloperOptionComponent } from './components/devloper-option/devloper-option.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatIconModule, RouterModule, MatButtonModule, DevloperOptionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  isLogoLoading = true;
  isLogoLoadingComplete = false;
  title = 'Small Games';
  baseTitle = 'Small Games';

  get isHomePage(): boolean {
    return this.title === this.baseTitle;
  }

  get isWifiConnected(): boolean {
    return this.userService.internetConnectionStatus?.connected ?? false;
  }

  get isSocketConnected() {
    return this.socketService.isConnected
  }

  constructor(
    public gameDashboardService: GameDashboardService,
    public router: Router,
    private dialog: MatDialog,
    public loggerService: LoggerService,
    public userService: UserService,
    public socketService: SocketService,
    private multiPlayerService: MultiPlayerService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd)) // Filter only NavigationEnd events
      .subscribe(() => {
        this.updateTitleFromRouteData();
      });

    if (Capacitor.getPlatform() !== 'web') {
      StatusBar.hide();
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.toggleIconLoading();
    }, 1500);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    // localStorage.setItem('lastTime', new Date().toISOString())
    this.userService.disconnectMe();
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

  hideLogs() {
    this.loggerService.resetShowLogs();
  }

  clearLogs() {
    this.loggerService.clearLogs();
  }

  clearLocalStorage() {
    const meUser = this.userService.me;
    localStorage.clear();
    if (meUser)
      localStorage.setItem(this.userService.meLocalStorageKey, JSON.stringify(meUser));
  }

  showMyQRCode() {
    this.dialog.open(MyQRCodeComponent)
  }

  toggleIconLoading() {
    this.isLogoLoading = !this.isLogoLoading;
    setTimeout(() => {
      this.isLogoLoadingComplete = !this.isLogoLoadingComplete;
    }, 1000);
  }
}
