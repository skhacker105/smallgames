import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IPlayer, IPlayerAskConfig, IUser } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PLAYER_COLOR } from '../../config';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '../../services/user.service';
import { filter, take, timeout } from 'rxjs';
import { GameRequestStatus } from '../../types';
import { GameDashboardService } from '../../services/game-dashboard.service';

@Component({
  selector: 'app-players-config',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatIconModule, MatMenuModule],
  templateUrl: './players-config.component.html',
  styleUrl: './players-config.component.scss'
})
export class PlayersConfigComponent {

  players: IPlayer[] = [];
  playerConenctionRequests = new Map<string, GameRequestStatus | undefined>();
  errorMessage: string = '';
  activeColorPickerIndex: number | null = null;

  get isNamesValid(): boolean {
    const nameCounts: { [key: string]: number } = {};
    this.players.forEach(p => {
      if (!nameCounts[p.name]) nameCounts[p.name] = 0;
      nameCounts[p.name] = nameCounts[p.name] + 1;
    });
    return !this.players.some(p => !p.name) && !Object.values(nameCounts).some(count => count > 1);
  }

  get isColorValid(): boolean {
    if (!this.config.colorOptions) return true;

    const selectedColors = this.players.map(player => player.color);
    const uniqueColors = new Set(selectedColors);
    return selectedColors.length === uniqueColors.size;
  }

  get isFormValid(): boolean {
    return this.isNamesValid && this.isColorValid
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: IPlayerAskConfig,
    public dialogRef: MatDialogRef<PlayersConfigComponent>,
    public userService: UserService,
    private gameDashboardService: GameDashboardService
  ) {
    config.preFillPlayers
      ? this.initializeExistingPlayersForm(config.preFillPlayers)
      : this.initializeDefaultPlayersForm();

  }

  initializeExistingPlayersForm(players: IPlayer[]): void {
    players.forEach(player => {
      const color = this.config.colorOptions ? (player.color ?? this.config.colorOptions[0]) : undefined;
      this.players.push({ name: player.name, color, userId: player.userId });
    });
  }

  initializeDefaultPlayersForm(): void {
    for (let i = 0; i < this.config.minPlayerCount; i++) {
      this.players.push({ name: '', color: this.config.colorOptions ? this.config.colorOptions[0] : undefined });
    }
  }

  addPlayer(): void {
    if (this.players.length < this.config.maxPlayerCount) {
      this.players.push({ name: '', color: this.config.colorOptions ? this.config.colorOptions[0] : undefined });

    } else {
      this.errorMessage = `Cannot exceed maximum of ${this.config.maxPlayerCount} players.`;
    }
  }

  removePlayer(index: number): void {
    if (this.players.length > this.config.minPlayerCount) {
      this.players.splice(index, 1);
      this.errorMessage = '';

    } else {
      this.errorMessage = `Cannot have fewer than ${this.config.minPlayerCount} players.`;
    }
  }

  selectColor(player: IPlayer, color: PLAYER_COLOR): void {
    player.color = color;
    this.activeColorPickerIndex = null;

  }

  toggleColorPicker(index: number): void {
    this.activeColorPickerIndex = this.activeColorPickerIndex === index ? null : index;
  }

  startConnectionWizard(player: IPlayer): void {
    const ref = this.userService.startConnectionWizard();
    ref.afterClosed().pipe(take(1))
      .subscribe((usr?: IUser) => {
        if (usr) {
          this.userService.addNewUserConnection(usr);
          this.setPlayerConnection(player, usr);
        }
      })
  }

  setPlayerConnection(player: IPlayer, usrCon: IUser) {
    player.userId = usrCon.userId;
    player.name = usrCon.userName;
    const connectionStatus = this.playerConenctionRequests.get(player.name);

    if (!connectionStatus || connectionStatus === 'rejected') {
      this.gameDashboardService.incomingGameRequestResponse$
        .pipe(
          filter(response => response?.gameKey === this.gameDashboardService.selectedGame.value?.key && response?.sourceUserId === player.userId),
          take(1),
          timeout(this.gameDashboardService.gameRequestWaitTime * 1000)
        )
        .subscribe({
          next: response => {
            this.playerConenctionRequests.set(player.name, response?.gameRequestStatus);
            if (response?.gameRequestStatus === 'rejected') this.fadeoutSelectedPlayer(player);
          },
          error: error => {
            this.playerConenctionRequests.set(player.name, undefined);
            this.gameDashboardService.sendGameCancelRequest(this.config.game, player);
            this.fadeoutSelectedPlayer(player);
          }
        });
      this.gameDashboardService.sendGameRequest(this.config.game, player);
      this.playerConenctionRequests.set(player.name, 'pending');
    }
  }

  fadeoutSelectedPlayer(player: IPlayer) {
    setTimeout(() => {
      this.playerConenctionRequests.delete(player.name);
      player.name = '';
      player.userId = undefined;
    }, 1500);
  }

  resetPlayer(player: IPlayer) {
    player.name = '';
    player.userId = undefined;
  }

  getPlayerRequestState(player: IPlayer): string {
    if (!player.userId) return 'no-connection';

    if (!this.playerConenctionRequests.has(player.name)) return 'no-connection';

    const stat = this.playerConenctionRequests.get(player.name);
    if (stat === undefined) return 'time-out';
    else return stat
  }

  submit(): void {
    if (this.players.some(player => !player.name.trim())) {
      this.errorMessage = 'All players must have a name.';
      return;
    }

    if (!this.isColorValid) {
      this.errorMessage = 'Each player must have a unique color.';
      return;
    }

    this.dialogRef.close(this.players);
  }
}
