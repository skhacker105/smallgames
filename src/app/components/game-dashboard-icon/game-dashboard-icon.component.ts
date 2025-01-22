import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IGameInfo } from '../../interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-dashboard-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-dashboard-icon.component.html',
  styleUrl: './game-dashboard-icon.component.scss'
})
export class GameDashboardIconComponent {

  @Input() gameInfo?: IGameInfo;
  @Output() iconClicked = new EventEmitter<void>();

}
