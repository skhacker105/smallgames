import { IConnectedUser } from "../interfaces";
import { ConnectionTypes, TabType } from "../types";

export class ConnectedUser implements IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection: ConnectionTypes;

    constructor(connectionName: string, connectionType: TabType, connection: ConnectionTypes) {
        this.connectionId = crypto.randomUUID();
        this.connectionName = connectionName;
        this.connectionType = connectionType;
        this.connection = connection;
    }
    
    isConnected(): boolean {
        return this.connection.connection?.connectionState === 'connected';
    }
}