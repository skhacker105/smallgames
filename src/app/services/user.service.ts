import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IUser } from '../interfaces';
import { UserInputComponent } from '../components/user-input/user-input.component';
import { take } from 'rxjs';
import { SocketService } from './socket.service';
import { ScanUserComponent } from '../components/scan-user/scan-user.component';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  me?: IUser;
  connectedUsers: IUser[] = [];
  internetConnectionStatus?: ConnectionStatus;

  meLocalStorageKey = 'meUser';
  connectedUsersLocalStorageKey = 'connectedUsers';

  constructor(private loggerService: LoggerService, private dialog: MatDialog, private socketService: SocketService) {
    this.refreshNetworkStatus();
    this.initialMeUserLoad();
    this.connectedUsersInitialLoad();
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

  connectedUsersInitialLoad(): void {
    const connectedUsers = localStorage.getItem(this.connectedUsersLocalStorageKey);
    if (connectedUsers) this.connectedUsers = JSON.parse(connectedUsers);
  }

  saveConnectedUsers(): void {
    if (this.connectedUsers.length > 0)
      localStorage.setItem(this.connectedUsersLocalStorageKey, JSON.stringify(this.connectedUsers));
    else
      localStorage.removeItem(this.connectedUsersLocalStorageKey);
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

  startConnectionWizard(): MatDialogRef<ScanUserComponent, any> {
    return this.dialog.open(ScanUserComponent, {
      width: '99vw'
    });
  }

  addNewUserConnection(usr: IUser): void {
    this.connectedUsers.push(usr);
    this.saveConnectedUsers();
  }

  removeUserConnection(id: string): void {
    this.connectedUsers = this.connectedUsers.filter(usr => usr.userId != id);
    this.saveConnectedUsers();
  }

  connectSocket() {
    if (!this.me) return;

    this.socketService.connect(this.me);
  }
}
