import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { ISocketMessage, IUser } from '../interfaces';
import { ConnectionState } from '../types';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket?: Socket;
  private SERVER_URL = 'http://localhost:3000'; // Adjust based on your backend
  private messageSubject = new Subject<ISocketMessage | null>();
  private connectionStatusSubject = new BehaviorSubject<ConnectionState>('disconnected');

  message$ = this.messageSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  get isConnected(): boolean {
    return this.connectionStatusSubject.value === 'connected'
  }

  constructor(private loggerService: LoggerService) {
    this.SERVER_URL = environment.socketServer;
  }

  connect(user: IUser): void {

    if (!user.userId || !user.userName) {
      this.loggerService.log('User ID and name are required for connection');
      return;
    }

    this.socket = io(this.SERVER_URL, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.connectionStatusSubject.next('connected');
      this.loggerService.log('Connected to WebSocket server');

      // Register the user with userId
      this.socket?.emit('register', { userId: user.userId });

      // Listen for incoming messages
      this.socket?.on('receive_message', (data: { message: ISocketMessage }) => {
        this.loggerService.log(`New message received: ${data.message}`);

        if (!data.message) {
          this.loggerService.log('Message is blank.')
        } else {
          try {
            this.messageSubject.next(data.message); // Push to observable
          } catch (er) {
            this.loggerService.log(`Error while converting message to object ${data.message}`);
            this.loggerService.log('Error while converting message to object');
          }
        }
      });
    });

    this.socket.on('disconnect', () => {
      this.connectionStatusSubject.next('disconnected');
      this.loggerService.log('Disconnected from server');
    });
  }

  // Send a message to another user
  sendMessage(toUserId: string, message: ISocketMessage): void {
    if (this.socket) {
      this.socket.emit('send_message', { toUserId, message });
      this.loggerService.log(`Message sent to ${toUserId}: ${message}`);
    } else {
      this.loggerService.log('Socket is not connected');
    }
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
