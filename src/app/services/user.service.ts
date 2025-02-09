import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PeerConnetionComponent } from '../components/peer-connetion/peer-connetion.component';
import { ConnectedUser } from '../classes/connected-user.class';
import { IUser } from '../interfaces';
import { UserInputComponent } from '../components/user-input/user-input.component';
import { take } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  me?: IUser;
  internetConnectionStatus?: ConnectionStatus;
  connectedUsers: ConnectedUser[] = [];

  meLocalStorageKey = 'meUser';

  constructor(private loggerService: LoggerService, private dialog: MatDialog, private socketService: SocketService) {
    this.refreshNetworkStatus();
    this.initialMeUserLoad();
  }

  ngOnDestroy(): void {
    Network.removeAllListeners();
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

  initialMeUserLoad(): void {
    const saved = localStorage.getItem(this.meLocalStorageKey)
    if (!saved) {
      const ref = this.askForMeUser();
      ref.afterClosed().pipe(take(1))
        .subscribe((userName: string) => this.setMeUser(userName));
      return;
    }

    this.me = JSON.parse(saved);
    this.connectSocket();
  }

  askForMeUser(): MatDialogRef<UserInputComponent, any> {
    return this.dialog.open(UserInputComponent, {
      data: {
        title: 'Enter Your Name',
        defaultValue: this.me?.userName
      }
    })
  }

  setMeUser(userName: string): void {
    if (!userName) return;
    
    if (!this.me) {
      this.me = {
        userId: crypto.randomUUID(),
        userName
      };
      this.connectSocket();
    } else {
      this.me.userName = userName;
    }
    localStorage.setItem(this.meLocalStorageKey, JSON.stringify(this.me))
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

  isUserConnectionLive(connectionId?: string): boolean {
    if (!connectionId) return false;

    const connectedUser = this.connectedUsers.find(usr => usr.connectionId === connectionId);
    if (!connectedUser) return false;

    return connectedUser.isConnected();
  }

  connectSocket() {
    if (!this.me) return;

    this.socketService.connect(this.me);
  }
}
