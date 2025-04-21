import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [NgxSpinnerModule, MatProgressSpinnerModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent implements OnChanges {

  @Input() message: string | undefined;

  isSpinning = false;

  constructor(private spinner: NgxSpinnerService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.message && !this.isSpinning) {
      this.spinner.show();
      this.isSpinning = true;
    }
    else if (!this.message && this.isSpinning) {
      this.spinner.hide();
      this.isSpinning = false;
    }
  }
}
