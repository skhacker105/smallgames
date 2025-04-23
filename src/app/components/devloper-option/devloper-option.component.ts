import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { LocalStorageComponent } from '../local-storage/local-storage.component';
import { LogsComponent } from '../logs/logs.component';
import { MatIconModule } from '@angular/material/icon';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-devloper-option',
  standalone: true,
  imports: [MatTabsModule, LocalStorageComponent, LogsComponent, MatIconModule],
  templateUrl: './devloper-option.component.html',
  styleUrl: './devloper-option.component.scss'
})
export class DevloperOptionComponent {

  constructor(public loggerService: LoggerService) { }


  hideLogs() {
    this.loggerService.resetShowLogs();
  }

}
