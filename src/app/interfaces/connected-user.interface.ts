import { ConnectionTypes, TabType } from "../types";

export interface IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection: ConnectionTypes;
    isConnected: () => boolean;
}