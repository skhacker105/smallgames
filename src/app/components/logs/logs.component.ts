import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LoggerService } from '../../services/logger.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatTooltipModule],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent {

  constructor(public loggerService: LoggerService) { }

  clearLogs() {
    this.loggerService.clearLogs();
  }
}
