import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IPlayer, IPlayerAskConfig, IUser } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PLAYER_COLOR } from '../../config';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '../../services/user.service';
import { Subject, filter, take, takeUntil, timeout } from 'rxjs';
import { GameRequestStatus } from '../../types';
import { GameDashboardService } from '../../services/game-dashboard.service';
import { PlayerNamePipe } from '../../pipe/player-name.pipe';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-players-config',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatIconModule, MatMenuModule, PlayerNamePipe, NgxSpinnerModule],
  templateUrl: './players-config.component.html',
  styleUrl: './players-config.component.scss'
})
export class PlayersConfigComponent implements OnInit, OnDestroy {

  players: IPlayer[] = [];
  playerConenctionRequests = new Map<string, GameRequestStatus | undefined>();
  errorMessage: string = '';
  activeColorPickerIndex: number | null = null;

  gameStarted = new Subject<boolean>();
  componentIsActive = new Subject<boolean>();

  get isNamesValid(): boolean {
    const nameCounts: { [key: string]: number } = {};
    this.players.forEach(p => {
      if (!nameCounts[p.name]) nameCounts[p.name] = 0;
      nameCounts[p.name] = nameCounts[p.name] + 1;
    });
    const anyUnAceptedPlayer = this.players.some(p => {
      if (p.userId === this.userService.me?.userId) return false;
      return !!p.userId && (!this.playerConenctionRequests.has(p.name) || this.playerConenctionRequests.get(p.name) !== 'accepted')
    })
    return !this.players.some(p => !p.name) && !Object.values(nameCounts).some(count => count > 1) && !anyUnAceptedPlayer;
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

  get isGameStart(): boolean {
    return this.gameDashboardService.selectedGame.value?.isGameStart ?? false;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: IPlayerAskConfig,
    public dialogRef: MatDialogRef<PlayersConfigComponent>,
    public userService: UserService,
    public gameDashboardService: GameDashboardService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
  }

  ngOnInit(): void {
    if (!this.isGameStart) {
      this.config.preFillPlayers
        ? this.initializeExistingPlayersForm(this.config.preFillPlayers)
        : this.initializeDefaultPlayersForm();

      this.gameDashboardService.incomingGameRequest$.pipe(takeUntil(this.componentIsActive))
        .subscribe(request => {
          this.spinner.show();
          if (this.gameDashboardService.selectedGame.value) {
            this.gameDashboardService.selectedGame.value.isGameStart = true;
            this.handlePlayerUpdateFromHost();
            this.handlePlayerGameStart();
          }
        });

    } else {
      this.spinner.show();
      this.handlePlayerUpdateFromHost();
      this.handlePlayerGameStart();
    }

    this.handleIncomingGameRequestResponse();
    this.handleIncomingGameCancelRequest();
  }

  ngOnDestroy(): void {
    this.gameStarted.next(true);
    this.gameStarted.complete();
    this.componentIsActive.next(true);
    this.componentIsActive.complete();
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
    if (this.userService.me) {
      this.players[0].userId = this.userService.me.userId;
      this.players[0].name = this.userService.me.userName;
    }
  }

  handlePlayerUpdateFromHost() {
    this.gameDashboardService.incomingGamePlayerUpdate$
      .pipe(filter(playerUpdateRequest => playerUpdateRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key))
      .subscribe(playerUpdateRequest => {
        this.spinner.hide();
        if (playerUpdateRequest?.gamePlayerUpdate) {
          this.players = playerUpdateRequest.gamePlayerUpdate;
        }
      });
  }

  handlePlayerGameStart() {
    this.gameDashboardService.incomingGameStart$
      .pipe(filter(playerUpdateRequest => playerUpdateRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key))
      .subscribe(playerUpdateRequest => { });
  }

  handleIncomingGameRequestResponse() {
    this.gameDashboardService.incomingGameRequestResponse$
      .pipe(
        filter(response => response?.gameKey === this.gameDashboardService.selectedGame.value?.key),
        takeUntil(this.componentIsActive)
      )
      .subscribe({
        next: response => {
          if (!response) return;

          this.playerConenctionRequests.set(response.sourceUserName, response.gameRequestStatus);
          const player = this.players.find(p => p.name === response.sourceUserName);
          if (player && response?.gameRequestStatus === 'rejected') this.fadeoutSelectedPlayer(player);
          setTimeout(() => {
            this.sendPlayerUpdates();
          }, 1000);
        },
        error: error => {
          // this.playerConenctionRequests.set(response.sourceUserName, undefined);
          // this.gameDashboardService.sendGameCancelRequest(this.config.game, player);
          // this.fadeoutSelectedPlayer(player);
          this.sendPlayerUpdates();
        }
      });
  }

  handleIncomingGameCancelRequest() {
    this.gameDashboardService.incomingGameRequestCancel$
      .pipe(
        filter(response => response?.gameKey === this.gameDashboardService.selectedGame.value?.key),
        takeUntil(this.componentIsActive)
      )
      .subscribe({
        next: response => {
          if (!response) return;

          const selectedGame = this.gameDashboardService.selectedGame.value;

          if (selectedGame && !selectedGame.gameOwner) {
            this.playerConenctionRequests.set(response.sourceUserName, response.gameRequestStatus);

            const player = this.players.find(p => p.name === response.sourceUserName);
            if (player) this.fadeoutSelectedPlayer(player);
            setTimeout(() => {
              this.sendPlayerUpdates();
            }, 1000);

          } else {
            this.dialogRef.close();
            this.router.navigateByUrl('');
          }
        },
        error: error => {
          // this.playerConenctionRequests.set(response.sourceUserName, undefined);
          // this.gameDashboardService.sendGameCancelRequest(this.config.game, player);
          // this.fadeoutSelectedPlayer(player);
          this.sendPlayerUpdates();
        }
      });
  }

  addPlayer(): void {
    if (this.players.length < this.config.maxPlayerCount) {
      this.players.push({ name: '', color: this.config.colorOptions ? this.config.colorOptions[0] : undefined });
      this.sendPlayerUpdates();
    } else {
      this.errorMessage = `Cannot exceed maximum of ${this.config.maxPlayerCount} players.`;
    }
  }

  removePlayer(index: number): void {
    if (this.players.length > this.config.minPlayerCount) {
      this.players.splice(index, 1);
      this.errorMessage = '';
      this.sendPlayerUpdates();
    } else {
      this.errorMessage = `Cannot have fewer than ${this.config.minPlayerCount} players.`;
    }
  }

  selectColor(player: IPlayer, color: PLAYER_COLOR): void {
    player.color = color;
    this.activeColorPickerIndex = null;
    this.sendPlayerUpdates();
  }

  toggleColorPicker(index: number): void {
    this.activeColorPickerIndex = this.activeColorPickerIndex === index ? null : index;
    this.sendPlayerUpdates();
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

      this.gameDashboardService.sendGameRequest(this.config.game, player);
      this.playerConenctionRequests.set(player.name, 'pending');
      this.sendPlayerUpdates();
    }
  }

  fadeoutSelectedPlayer(player: IPlayer) {
    setTimeout(() => {
      this.playerConenctionRequests.delete(player.name);
      player.name = '';
      player.userId = undefined;
      this.sendPlayerUpdates();
    }, 1500);
  }

  resetPlayer(player: IPlayer) {
    player.name = '';
    player.userId = undefined;
    this.sendPlayerUpdates();
  }

  getPlayerRequestState(player: IPlayer): string {
    if (!player.userId) return 'no-connection';

    if (!this.playerConenctionRequests.has(player.name)) return 'no-connection';

    const stat = this.playerConenctionRequests.get(player.name);
    if (stat === undefined) return 'time-out';
    else return stat
  }

  sendPlayerUpdates() {
    if (!this.gameDashboardService.selectedGame.value) return

    this.gameDashboardService.sendGamePlayerUpdate(this.gameDashboardService.selectedGame.value, this.players);
  }

  cancelGame() {
    this.dialogRef.close();

    // if (!this.isGameStart) return;

    const selectedGame = this.gameDashboardService.selectedGame.value;
    const me = this.userService.me;

    if (selectedGame && selectedGame.gameOwner) {
      const ownerPlayer = this.players.find(p => p.userId === this.gameDashboardService.selectedGame.value?.gameOwner?.userId);

      if (!ownerPlayer) return;
      this.gameDashboardService.sendGameCancelRequest(this.config.game, ownerPlayer);

    } else if (selectedGame && me) {
      const otherPlayers = this.players.filter(p => p.userId && p.userId !== me.userId);

      if (otherPlayers.length === 0) return;
      otherPlayers.forEach(op => this.gameDashboardService.sendGameCancelRequest(this.config.game, op));
    }
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

  // Events from Host
  handlePlayerUpdate(): void {
    this.gameDashboardService.incomingGamePlayerUpdate$
      .pipe(
        filter(playerUpdateRequest => playerUpdateRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
        takeUntil(this.componentIsActive),
        takeUntil(this.gameStarted)
      )
      .subscribe(playerUpdateRequest => {
        if (!playerUpdateRequest) return;

        // this.players = 
        // assign incoming playerUpdateRequest.gamePlayerUpdate to Players List
        // show Me as player
      });
  }
}
