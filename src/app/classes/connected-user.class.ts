import { IConnectedUser, IUser } from "../interfaces";
import { ConnectionTypes, TabType } from "../types";

export class ConnectedUser implements IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection: ConnectionTypes;
    connectedUser: IUser;

    constructor(connectionType: TabType, connection: ConnectionTypes, connectedUser: IUser) {
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