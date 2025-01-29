import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IPlayer, IPlayerAskConfig } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PLAYER_COLOR } from '../../config';

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
  activeColorPickerIndex: number | null = null;
  isColorValid: boolean = true; // New state to track color uniqueness

  constructor(@Inject(MAT_DIALOG_DATA) public config: IPlayerAskConfig, public dialogRef: MatDialogRef<PlayersConfigComponent>) {
    config.preFillPlayers
      ? this.initializeExistingPlayersForm(config.preFillPlayers)
      : this.initializeDefaultPlayersForm();
    this.isColorValid = this.isColorUnique(); // Validate color uniqueness
  }

  initializeExistingPlayersForm(players: IPlayer[]): void {
    players.forEach(player => {
      const color = this.config.colorOptions ? (player.color ?? this.config.colorOptions[0]) : undefined;
      this.players.push({ name: player.name, color });
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
      this.isColorValid = this.isColorUnique(); // Validate colors
    } else {
      this.errorMessage = `Cannot exceed maximum of ${this.config.maxPlayerCount} players.`;
    }
  }

  removePlayer(index: number): void {
    if (this.players.length > this.config.minPlayerCount) {
      this.players.splice(index, 1);
      this.errorMessage = '';
      this.isColorValid = this.isColorUnique(); // Validate after removal
    } else {
      this.errorMessage = `Cannot have fewer than ${this.config.minPlayerCount} players.`;
    }
  }

  selectColor(player: IPlayer, color: PLAYER_COLOR): void {
    player.color = color;
    this.activeColorPickerIndex = null;
    this.isColorValid = this.isColorUnique(); // Validate color uniqueness
  }

  toggleColorPicker(index: number): void {
    this.activeColorPickerIndex = this.activeColorPickerIndex === index ? null : index;
  }

  isColorUnique(): boolean {
    const selectedColors = this.players.map(player => player.color);
    const uniqueColors = new Set(selectedColors);
    return selectedColors.length === uniqueColors.size;
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
