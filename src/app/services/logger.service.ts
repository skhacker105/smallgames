import { Injectable } from '@angular/core';
import { DefaultPasswordHashing } from '../classes';
import { environment } from '../../environments/environment';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DevloperOptionComponent } from '../components/devloper-option/devloper-option.component';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private _showDeveloperOption = false;
  private messages: string[] = [];
  private popupRef?: MatDialogRef<any>;

  get showDeveloperOption(): boolean {
    return this._showDeveloperOption;
  }

  get logMessages(): string[] {
    return this.messages;
  }

  constructor(private dialog: MatDialog) { }

  async setShowLogs(password: string) {
    this._showDeveloperOption = await DefaultPasswordHashing.verifyInput(password);

    if (this._showDeveloperOption) this.popupRef = this.dialog.open(DevloperOptionComponent, { width: '95vw', height: '90vh' });
    else this.popupRef?.close();
  }

  resetShowLogs() {
    this._showDeveloperOption = false;
    this.popupRef?.close();
  }

  clearLogs(): void {
    this.messages = [];
  }

  log(message: any, mandatory = false): void {
    if (!environment.production || mandatory)
      console.log(message)
    this.messages.push(message);
  }
}
