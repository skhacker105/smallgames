import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IGameMultiPlayerConnection, IPlayer, IPlayerAskConfig, ISocketMessage, IUser } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PLAYER_COLOR } from '../../config';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '../../services/user.service';
import { Observable, Subject, filter, merge, take, takeUntil, timeout } from 'rxjs';
import { GameRequestStatus } from '../../types';
import { GameDashboardService } from '../../services/game-dashboard.service';
import { PlayerNamePipe } from '../../pipe/player-name.pipe';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MultiPlayerService } from '../../services/multi-player.service';
import { LoggerService } from '../../services/logger.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-players-config',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatIconModule, MatMenuModule, PlayerNamePipe, NgxSpinnerModule, MatProgressSpinnerModule],
  templateUrl: './players-config.component.html',
  styleUrl: './players-config.component.scss'
})
export class PlayersConfigComponent implements OnInit, OnDestroy {

  players: IPlayer[] = [];
  errorMessage: string = '';
  activeColorPickerIndex: number | null = null;

  componentIsActive = new Subject<boolean>();

  multiPlayerConnection?: IGameMultiPlayerConnection;
  multiUserState = new Map<string, GameRequestStatus>();
  playersResponse$: Observable<ISocketMessage | null>[] = [];

  get isNamesValid(): boolean {
    const nameCounts: { [key: string]: number } = {};
    this.players.forEach(p => {
      if (!nameCounts[p.name]) nameCounts[p.name] = 0;
      nameCounts[p.name] = nameCounts[p.name] + 1;
    });
    // const anyUnAceptedPlayer = this.players.some(p => {
    //   if (p.userId === this.userService.me?.userId) return false;
    //   return !!p.userId
    // })
    return !this.players.some(p => !p.name) && !Object.values(nameCounts).some(count => count > 1) // && !anyUnAceptedPlayer;
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

  // get isGameStart(): boolean {
  //   return false;
  // }

  get isAnyPlayerOnline(): boolean {
    return this.players.some(player => !!player.userId && player.userId !== this.userService.me?.userId); // any player having user id
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: IPlayerAskConfig,
    public dialogRef: MatDialogRef<PlayersConfigComponent>,
    public userService: UserService,
    public gameDashboardService: GameDashboardService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private multiPlayerService: MultiPlayerService,
    private loggerService: LoggerService
  ) {
  }

  ngOnInit(): void {
    // if (!this.isGameStart) {
    const anyExistingGame = this.multiPlayerService.anyGameInProgressStatus(this.config.game.key);

    if (!anyExistingGame) {
      this.config.preFillPlayers
        ? this.initializeExistingPlayersForm(this.config.preFillPlayers)
        : this.initializeDefaultPlayersForm();
    } else {
      // Pending code to ask if want to continue with prev game or set new game players by cancelling previous one
    }
  }

  ngOnDestroy(): void {
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

  addPlayer(): void {
    if (this.players.length < this.config.maxPlayerCount) {
      this.players.push({ name: '', color: this.config.colorOptions ? this.config.colorOptions[0] : undefined });
      // this.sendPlayerUpdates();
    } else {
      this.errorMessage = `Cannot exceed maximum of ${this.config.maxPlayerCount} players.`;
    }
  }

  removePlayer(index: number): void {
    if (this.players.length > this.config.minPlayerCount) {
      this.players.splice(index, 1);
      this.errorMessage = '';
      // this.sendPlayerUpdates();
    } else {
      this.errorMessage = `Cannot have fewer than ${this.config.minPlayerCount} players.`;
    }
  }

  selectColor(player: IPlayer, color: PLAYER_COLOR): void {
    player.color = color;
    this.activeColorPickerIndex = null;
    // this.sendPlayerUpdates();
  }

  toggleColorPicker(index: number): void {
    this.activeColorPickerIndex = this.activeColorPickerIndex === index ? null : index;
    // this.sendPlayerUpdates();
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
    // const connectionStatus = this.playerConenctionRequests.get(player.name);

    // if (!connectionStatus || connectionStatus === 'rejected') {

    //   this.gameDashboardService.sendGameRequest(this.config.game, player);
    //   this.playerConenctionRequests.set(player.name, 'pending');
    //   this.sendPlayerUpdates();
    // }
  }

  // fadeoutSelectedPlayer(player: IPlayer) {
  //   setTimeout(() => {
  //     this.playerConenctionRequests.delete(player.name);
  //     player.name = '';
  //     player.userId = undefined;
  //     this.sendPlayerUpdates();
  //   }, 1500);
  // }

  resetPlayer(player: IPlayer) {
    player.name = '';
    player.userId = undefined;
    // this.sendPlayerUpdates();
  }

  // getPlayerRequestState(player: IPlayer): string {
  //   if (!player.userId) return 'no-connection';

  //   if (!this.playerConenctionRequests.has(player.name)) return 'no-connection';

  //   const stat = this.playerConenctionRequests.get(player.name);
  //   if (stat === undefined) return 'time-out';
  //   else return stat
  // }

  // sendPlayerUpdates() {
  //   if (!this.gameDashboardService.selectedGame.value) return

  //   this.gameDashboardService.sendGamePlayerUpdate(this.gameDashboardService.selectedGame.value, this.players);
  // }

  cancelGame() {
    this.dialogRef.close();

    // if (!this.isGameStart) return;

    // const selectedGame = this.gameDashboardService.selectedGame.value;
    // const me = this.userService.me;

    // if (selectedGame && selectedGame.gameOwner) {
    //   const ownerPlayer = this.players.find(p => p.userId === this.gameDashboardService.selectedGame.value?.gameOwner?.userId);

    //   if (!ownerPlayer) return;
    //   this.gameDashboardService.sendGameCancelRequest(this.config.game, ownerPlayer);

    // } else if (selectedGame && me) {
    //   const otherPlayers = this.players.filter(p => p.userId && p.userId !== me.userId);

    //   if (otherPlayers.length === 0) return;
    //   otherPlayers.forEach(op => this.gameDashboardService.sendGameCancelRequest(this.config.game, op));
    // }
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

    if (this.isAnyPlayerOnline) {
      this.spinner.show();

      // Create multiplayer game and send requestes to all players
      const multiPlayerConnection = this.multiPlayerService.startMultiPlayerGame(this.config.gameId, this.config.game, this.players);
      // Set MultiPlayerGame to local variable and handle all player's response
      this.setMultiPlayerGame(multiPlayerConnection);
    } else {
      this.dialogRef.close(this.players);
    }
  }

  setMultiPlayerGame(multiPlayerConnection?: IGameMultiPlayerConnection) {
    this.multiPlayerConnection = multiPlayerConnection;
    if (!multiPlayerConnection) return;

    this.multiUserState.clear();


    // Handle all player's response
    this.playersResponse$ = multiPlayerConnection.players
      .filter(p => !p.isMe && p.hasUser)
      .map(p => this.multiPlayerService.incomingGameRequestResponse$.pipe(filter(message => message?.sourceUserId === p.player.userId)));

    merge(...this.playersResponse$)
      .pipe(take(this.playersResponse$.length), takeUntil(this.componentIsActive))
      .subscribe({
        next: response => {
          this.setPlayerResponse(multiPlayerConnection, response);

          if (this.multiUserState.size === this.playersResponse$.length)
            this.completePlayersSubmissionAndGameCreation(multiPlayerConnection);

        },
        error: error => {
          this.loggerService.log(JSON.stringify({ error: error }));
        }
      });
  }

  setPlayerResponse(multiPlayerConnection: IGameMultiPlayerConnection, responseMessage: ISocketMessage | null): void {
    if (!responseMessage) return;

    this.multiUserState.set(responseMessage.sourceUserId, (responseMessage.gameRequestStatus ?? 'rejected'));

    const player = multiPlayerConnection.players.find(p => p.player.userId === responseMessage.sourceUserId);
    if (!player) {
      this.loggerService.log(`No Player found for ${JSON.stringify(responseMessage)}`);
      return;
    }

    player.connectionStatus = responseMessage.gameRequestStatus ?? 'rejected';
    player.connectionResponseSocketMessage = responseMessage;
  }

  completePlayersSubmissionAndGameCreation(multiPlayerConnection: IGameMultiPlayerConnection) {
    const acceptedPlayers = [...this.multiUserState.values()].filter((requestStatus: GameRequestStatus) => requestStatus === 'accepted')

    if (acceptedPlayers.length === this.multiUserState.size)
      this.dialogRef.close(multiPlayerConnection);

    else
      this.multiPlayerService.cancelMultiPlayerGame(this.config.gameId, this.config.game, `Some players rejected or did not respond to game request.`);

    this.spinner.hide();
  }

  // Events from Host
  // handlePlayerUpdate(): void {
  //   this.gameDashboardService.incomingGamePlayerUpdate$
  //     .pipe(
  //       filter(playerUpdateRequest => playerUpdateRequest?.gameKey === this.gameDashboardService.selectedGame.value?.key),
  //       takeUntil(this.componentIsActive),
  //       takeUntil(this.gameStarted)
  //     )
  //     .subscribe(playerUpdateRequest => {
  //       if (!playerUpdateRequest) return;

  //       // this.players = 
  //       // assign incoming playerUpdateRequest.gamePlayerUpdate to Players List
  //       // show Me as player
  //     });
  // }
}
