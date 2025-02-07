import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PeerConnetionComponent } from '../components/peer-connetion/peer-connetion.component';
import { ConnectedUser } from '../classes/connected-user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  internetConnectionStatus?: ConnectionStatus;
  connectedUsers: ConnectedUser[] = [];

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

  startConnectionWizard(): MatDialogRef<PeerConnetionComponent, any> {
    return this.dialog.open(PeerConnetionComponent, {
      width: '99vw'
    });
  }

  addNewUserConnection(usr: ConnectedUser): void {
    this.connectedUsers.push(usr);
  }

  removeUserConnection(id: string): void {
    this.connectedUsers = this.connectedUsers.filter(usr => usr.connectionId != id);
  }
}
