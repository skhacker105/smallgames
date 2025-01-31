import { Injectable } from '@angular/core';
import { DefaultPasswordHashing } from '../classes';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private _showLogs = true;
  private messages: string[] = [];

  get showLogs(): boolean {
    return this._showLogs;
  }

  get logMessages(): string[] {
    return this.messages;
  }

  constructor() { }

  async setShowLogs(password: string) {
    this._showLogs = await DefaultPasswordHashing.verifyInput(password);
  }

  resetShowLogs() {
    this._showLogs = false;
  }

  clearLogs(): void {
    this.messages = [];
  }

  log(message: string): void {
    this.messages.push(message);
  }
}
