import { Injectable } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  internetConnectionStatus?: ConnectionStatus;
  ipAddress: string = '';

  constructor(private loggerService: LoggerService) {
    this.refreshNetworkStatus();
  }

  refreshNetworkStatus() {
    this.connectToNetwork()
    .then(async (status) => {
      if (status) {
        if (status.connected) {
          this.ipAddress = (await this.getIPAddress()) ?? '';
          this.loggerService.log(`IP Address = ${this.ipAddress}`)
        } else {
          this.loggerService.log(`No internet connection`)
        }
      }
    });
  }
 
  async connectToNetwork(): Promise<ConnectionStatus | undefined> {
    try {
      const status = await Network.getStatus();
      console.log('Network status:', status);

      return status;
    } catch (error) {
      this.loggerService.log(`Error fetching network status: ${error}`);
      return undefined;
    }
  }

  async getIPAddress(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api64.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      this.loggerService.log(`Error fetching network status: ${error}`);
      return undefined;
    }
  }
}
