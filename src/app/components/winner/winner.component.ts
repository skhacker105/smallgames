import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-winner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './winner.component.html',
  styleUrl: './winner.component.scss'
})
export class WinnerComponent {
  
  @Input() winnerName?: string;
  @Input() winnerMessage?: string;
  @Input() isDraw: boolean = false;

  @Output() resetGame = new EventEmitter<void>();
  @Output() rematch = new EventEmitter<void>();

}
