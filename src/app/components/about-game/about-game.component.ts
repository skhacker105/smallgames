import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-about-game',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatListModule, MatCardModule],
  templateUrl: './about-game.component.html',
  styleUrl: './about-game.component.scss'
})
export class AboutGameComponent {
  constructor(public dialogRef: MatDialogRef<AboutGameComponent>) {}

  closePopup() {
    this.dialogRef.close();
  }
}
