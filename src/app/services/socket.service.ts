import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { IUser } from '../interfaces';
import { ConnectionState } from '../types';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  
  private socket?: Socket;
  private SERVER_URL = 'http://localhost:3000'; // Adjust based on your backend
  private messageSubject = new BehaviorSubject<string | null>(null);
  private connectionStatusSubject = new BehaviorSubject<ConnectionState>('disconnected');

  message$ = this.messageSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.SERVER_URL = environment.socketServer
  }

  connect(user: IUser): void {

    if (!user.userId || !user.userName) {
      console.error('User ID and name are required for connection');
      return;
    }

    this.socket = io(this.SERVER_URL, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.connectionStatusSubject.next('connected');
      console.log('Connected to WebSocket server');

      // Register the user with userId
      this.socket?.emit('register', { userId: user.userId });

      // Listen for incoming messages
      this.socket?.on('receive_message', (data: { message: string }) => {
        console.log('New message received:', data.message);
        this.messageSubject.next(data.message); // Push to observable
      });
    });

    this.socket.on('disconnect', () => {
      this.connectionStatusSubject.next('disconnected');
      console.log('Disconnected from server');
    });
  }

  // Send a message to another user
  sendMessage(toUserId: string, message: string): void {
    if (this.socket) {
      this.socket.emit('send_message', { toUserId, message });
      console.log(`Message sent to ${toUserId}: ${message}`);
    } else {
      console.error('Socket is not connected');
    }
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
