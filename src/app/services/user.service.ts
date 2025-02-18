import { Injectable } from '@angular/core';
import { ConnectionStatus, Network } from '@capacitor/network';
import { LoggerService } from './logger.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ISocketMessage, IUser } from '../interfaces';
import { UserInputComponent } from '../components/user-input/user-input.component';
import { filter, take } from 'rxjs';
import { SocketService } from './socket.service';
import { ScanUserComponent } from '../components/scan-user/scan-user.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ConnectionState } from '../types';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  me?: IUser;
  connectedUsers: IUser[] = [];
  disconnectedUsers: IUser[] = [];
  internetConnectionStatus?: ConnectionStatus;

  SERVER_URL: string;
  meLocalStorageKey = 'meUser';
  connectedUsersLocalStorageKey = 'connectedUsers';
  disConnectedUsersLocalStorageKey = 'disConnectedUsers';

  constructor(
    private loggerService: LoggerService,
    private dialog: MatDialog,
    private socketService: SocketService,
    private http: HttpClient
  ) {
    this.SERVER_URL = environment.socketServer;
    this.refreshNetworkStatus();
    this.connectedUsersInitialLoad();
    this.initialMeUserLoad();
    this.socketService.message$.pipe(filter(message => message?.type === 'status'))
      .subscribe(message => {
        if (message) this.handleUserConnectionStateChange(message);
      });
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
    const disconnectedUsers = localStorage.getItem(this.disConnectedUsersLocalStorageKey);
    if (disconnectedUsers) {
      this.disconnectedUsers = JSON.parse(disconnectedUsers);
    }
    const connectedUsers = localStorage.getItem(this.connectedUsersLocalStorageKey);
    if (connectedUsers) {
      this.connectedUsers = JSON.parse(connectedUsers);
      this.updateConnectedUsersOnlineStatus();
    }
  }

  saveConnectedUsers(): void {
    if (this.connectedUsers.length > 0)
      localStorage.setItem(this.connectedUsersLocalStorageKey, JSON.stringify(this.connectedUsers));
    else
      localStorage.removeItem(this.connectedUsersLocalStorageKey);
  }

  updateConnectedUsersOnlineStatus() {
    if (this.connectedUsers.length === 0) return;

    const url = this.SERVER_URL + '/online-users';
    const connectedUserIds = this.connectedUsers.map(cu => cu.userId);
    this.http.post(url, { userIds: connectedUserIds }).pipe(take(1))
      .subscribe({
        next: (res: any) => {
          const onlineUsers = new Set<string>(res.onlineUsers);
          this.connectedUsers.forEach(cu => cu.isOnline = onlineUsers.has(cu.userId));
        },
        error: err => {
          this.loggerService.log('Error while fetching online users.');
        }
      })
  }

  initialMeUserLoad(): void {
    const saved = localStorage.getItem(this.meLocalStorageKey);
    if (!saved) {
      const ref = this.askForMeUser();
      ref.afterClosed().pipe(take(1))
        .subscribe((userName: string) => this.setMeUser(userName));
      return;
    }

    this.me = JSON.parse(saved);
    this.connectMEToSocket();
  }

  askForMeUser(): MatDialogRef<UserInputComponent, any> {
    return this.dialog.open(UserInputComponent, {
      data: {
        title: 'Enter Your Name',
        defaultValue: this.me?.userName
      },
      disableClose: true
    })
  }

  setMeUser(userName: string): void {
    if (!userName) return;

    if (!this.me) {
      this.me = {
        userId: crypto.randomUUID(),
        userName
      };
      this.connectMEToSocket();
    } else {
      this.me.userName = userName;
    }
    localStorage.setItem(this.meLocalStorageKey, JSON.stringify(this.me))
  }

  startConnectionWizard(): MatDialogRef<ScanUserComponent, any> {
    return this.dialog.open(ScanUserComponent, {
      width: '99vw',
      disableClose: true
    });
  }

  addNewUserConnection(usr: IUser): void {
    const existingUserIndex = this.connectedUsers.findIndex(cu => cu.userId === usr.userId);
    if (existingUserIndex === -1)
      this.connectedUsers.push(usr);
    else
      this.connectedUsers[existingUserIndex] = usr;
    this.saveConnectedUsers();
    this.updateConnectedUsersOnlineStatus();
  }

  removeUserConnection(id: string): void {
    this.connectedUsers = this.connectedUsers.filter(usr => usr.userId != id);
    this.saveConnectedUsers();
  }

  connectMEToSocket() {
    if (!this.me) return;

    this.socketService.connect(this.me);
    this.sendMyConnectionStateUpdates('connected');
  }

  sendMyConnectionStateUpdates(state: ConnectionState): void {
    if (this.connectedUsers.length === 0 || !this.me) return;

    const message: ISocketMessage = {
      sentOn: new Date(),
      sourceUserId: this.me.userId,
      sourceUserName: this.me.userName,
      type: 'status',
      connectionStatus: state
    };
    this.connectedUsers.forEach(cu => {
      this.socketService.sendMessage(cu.userId, message);
    });
  }

  handleUserConnectionStateChange(message: ISocketMessage) {
    const existingConnectedUser = this.connectedUsers.find(cu => cu.userId === message.sourceUserId);
    const existingDisconnectedUser = this.disconnectedUsers.find(dcu => dcu.userId === message.sourceUserId);
    if (!existingConnectedUser && !existingDisconnectedUser) {
      this.connectedUsers.push({
        userId: message.sourceUserId,
        userName: message.sourceUserName,
        isOnline: !message.connectionStatus || message.connectionStatus === 'disconnected' ? false : true
      });

      return;
    }
    if (existingConnectedUser) {
      existingConnectedUser.isOnline = !message.connectionStatus || message.connectionStatus === 'disconnected' ? false : true
    }
    this.saveConnectedUsers();
  }

  disconnectMe(): void {
    Network.removeAllListeners();
    this.sendMyConnectionStateUpdates('disconnected');
    this.socketService.disconnect();
  }
}
