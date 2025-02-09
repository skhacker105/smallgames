import { P2P } from "../classes";
import { TabType } from "../types";

export interface IConnectedUser {
    connectionId: string;
    connectionName: string;
    connectionType: TabType;
    connection: P2P;
    isConnected: () => boolean;
}