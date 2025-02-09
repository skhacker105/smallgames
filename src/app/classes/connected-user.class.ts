import { Socket } from "socket.io-client";
import { IConnectedUser, IUser } from "../interfaces";
import { TabType } from "../types";
import { P2P, P2PServer } from "./";
import { SocketService } from "../services/socket.service";

export class ConnectedUser implements IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection?: P2P;
    connectedUser: IUser;

    constructor(connectionType: TabType, connectedUser: IUser, private socketService: SocketService) {
        this.connectionId = crypto.randomUUID();
        this.connectionName = connectedUser.userName;
        this.connectionType = connectionType;
        this.connectedUser = connectedUser;
    }

    isConnected(): boolean {
        return this.connection?.connection?.connectionState === 'connected';
    }

    setConnection(connection: P2P): void {
        this.connection = connection;
    }

    retryConnectionUsingSocket(): void {
    }
}