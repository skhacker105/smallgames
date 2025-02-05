import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { MatDialog } from '@angular/material/dialog';
import { PeerConnetionComponent } from '../components/peer-connetion/peer-connetion.component';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  internetConnectionStatus?: ConnectionStatus;
  ipAddress: string = '';

  constructor(private loggerService: LoggerService, private dialog: MatDialog) {
    this.refreshNetworkStatus();
  }

  async refreshNetworkStatus() {
    this.internetConnectionStatus = await this.connectToNetwork();
    Network.addListener('networkStatusChange', (status) => {
      this.internetConnectionStatus = status;
    });
  }

  async connectToNetwork(): Promise<ConnectionStatus | undefined> {
    try {
      const status = await Network.getStatus();
      return status;

    } catch (error) {

      this.loggerService.log(`Error fetching network status: ${error}`);
      return undefined;
    }
  }

  ngOnDestroy(): void {
    Network.removeAllListeners();
  }

  createServer(): void {
    this.dialog.open(PeerConnetionComponent, {
      width: '90vw'
    })
  }
}
