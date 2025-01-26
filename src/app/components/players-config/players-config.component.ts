import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IPlayer, IPlayerAskConfig } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-players-config',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatIconModule],
  templateUrl: './players-config.component.html',
  styleUrl: './players-config.component.scss'
})
export class PlayersConfigComponent {
  players: IPlayer[] = [];
  errorMessage: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) public config: IPlayerAskConfig, public dialogRef: MatDialogRef<PlayersConfigComponent>) {
    config.preFillPlayers
      ? this.initializeExistingPlayersForm(config.preFillPlayers)
      : this.initializeDefaultPlayersForm()
  }

  initializeExistingPlayersForm(players: IPlayer[]): void {
    players.forEach(player => {
      const color = this.config.askForColor ? (player.color ?? '#ffffff') : undefined;
      this.players.push({ name: player.name, color });
    })
  }

  initializeDefaultPlayersForm(): void {
    // Initialize with minimum players
    for (let i = 0; i < this.config.minPlayerCount; i++) {
      this.players.push({ name: '', color: this.config.askForColor ? '#ffffff' : undefined });
    }
  }

  addPlayer(): void {
    if (this.players.length < this.config.maxPlayerCount) {
      this.players.push({ name: '', color: this.config.askForColor ? '#ffffff' : undefined });
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

  submit(): void {
    if (this.players.some(player => !player.name.trim())) {
      this.errorMessage = 'All players must have a name.';
      return;
    }

    this.dialogRef.close(this.players)
  }
}
