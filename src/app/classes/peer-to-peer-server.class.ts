import { BehaviorSubject, Observable, Subject, combineLatest, map, of, skip, take, takeUntil } from "rxjs";

export abstract class P2P {

    protected peerConnection?: RTCPeerConnection;
    protected dataChannel?: RTCDataChannel;
    protected _messages: string[] = [];

    public channelOpened$ = new BehaviorSubject<boolean>(false);
    public messageReceived$ = new Subject<string>();

    protected localDescription$ = new BehaviorSubject<RTCSessionDescription | null | undefined>(undefined);
    protected localCandidates$ = new BehaviorSubject<RTCIceCandidate[]>([]);

    public localCandidates = this.localCandidates$.pipe(map(candidates => candidates.map(o => JSON.stringify(o)).join('\n')));
    public localDescription = this.localDescription$.pipe(map(offer => JSON.stringify(offer)));

    get connection(): RTCPeerConnection | undefined {
        return this.peerConnection
    }

    abstract start(): void;
    abstract handleDataChannel(): void;

    handleCandidateCreation() {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const localCandidates = this.localCandidates$.value;
                localCandidates.push(event.candidate);
                this.localCandidates$.next(localCandidates);
            }
        };
    }

    async setRemoteDescription(remoteDescription: string) {
        const remoteDesc = JSON.parse(remoteDescription);
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        if (remoteDesc.type === 'offer') {
            const answer = await this.peerConnection?.createAnswer();
            await this.peerConnection?.setLocalDescription(answer);
            this.localDescription$.next(this.peerConnection?.localDescription);
        }
    }

    async addRemoteCandidates(remoteCandidates: string) {
        const candidates = remoteCandidates.trim().split('\n');
        candidates.forEach(async (candidate) => {
            if (candidate) {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
            }
        });
    }

    closeConnection(): void {
        this.peerConnection?.close();
    }

    sendMessage(inputMessage: string) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(inputMessage);
        }
    }
}

export class P2PServer extends P2P {

    start(): void {
        this.peerConnection = new RTCPeerConnection();
        this.handleCandidateCreation();
        this.handleDataChannel();
        this.createlocalDescription();
    }

    handleDataChannel(): void {
        if (!this.peerConnection) return;

        this.dataChannel = this.peerConnection.createDataChannel('chat');
        this.dataChannel.onopen = () => {
            this.channelOpened$.next(true);
        };
        this.dataChannel.onmessage = (event) => {
            this._messages.push(event.data);
            this.messageReceived$.next(event.data);
        };
    }

    async createlocalDescription() {
        if (!this.peerConnection) return;

        this.peerConnection.createOffer().then((offer) => {
            return this.peerConnection?.setLocalDescription(offer);
        }).then(() => {
            if (!this.peerConnection) return;

            this.localDescription$.next(this.peerConnection.localDescription)
        });
    }
}


export class P2PClient extends P2P {

    start(): void {
        this.peerConnection = new RTCPeerConnection();

        this.handleCandidateCreation();

        this.handleDataChannel();
    }

    handleDataChannel(): void {
        if (!this.peerConnection) return;

        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;

            this.dataChannel.onopen = () => {
                this.channelOpened$.next(true);
            };
            this.dataChannel.onmessage = (event) => {
                this._messages.push(event.data);
                this.messageReceived$.next(event.data);
            };
        }

    }
}
