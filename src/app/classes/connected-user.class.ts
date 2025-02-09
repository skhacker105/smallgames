import { IConnectedUser, IUser } from "../interfaces";
import { TabType } from "../types";
import { P2P } from "./";

export class ConnectedUser implements IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection: P2P;
    connectedUser: IUser;

    constructor(connectionType: TabType, connection: P2P, connectedUser: IUser) {
        this.connectionId = crypto.randomUUID();
        this.connectionName = connectedUser.userName;
        this.connectionType = connectionType;
        this.connection = connection;
        this.connectedUser = connectedUser;
    }
    
    isConnected(): boolean {
        return this.connection.connection?.connectionState === 'connected';
    }
}