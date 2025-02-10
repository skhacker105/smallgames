import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IYesNoConfig } from '../../interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-yes-no-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yes-no-dialog.component.html',
  styleUrl: './yes-no-dialog.component.scss'
})
export class YesNoDialogComponent implements OnInit, OnDestroy {

  countDown = 0;
  intervalId: any;

  constructor(
    public dialogRef: MatDialogRef<YesNoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public config: IYesNoConfig
  ) {}

  ngOnInit(): void {
    if (this.config.countDown) {
      this.startInterval(this.config.countDown);
    }
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }

  startInterval(limit: number): void {
    this.intervalId = setInterval(() => {
      this.countDown++;
      if (this.countDown >= limit) {
        this.clearInterval();
        this.dialogRef.close(false);
      }
    }, 1000);
  }

  clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
