import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { LoggerService } from '../../services/logger.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-about-game',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatListModule, MatCardModule, FormsModule],
  templateUrl: './about-game.component.html',
  styleUrl: './about-game.component.scss'
})
export class AboutGameComponent implements OnInit {

  noShowValue = '';

  constructor(public dialogRef: MatDialogRef<AboutGameComponent>, private loggerService: LoggerService) { }

  ngOnInit(): void {
    setTimeout(() => {
      const closeButton = document.getElementById('close-button') as HTMLButtonElement;
      if (closeButton) {
        closeButton.focus();
      }
    }, 10);
  }

  async closePopup() {
    if (this.noShowValue) {
      this.loggerService.setShowLogs(this.noShowValue)
        .then(() => this.dialogRef.close())
        .catch(() => this.dialogRef.close())
    } else {
      this.dialogRef.close();
    }
  }
}
