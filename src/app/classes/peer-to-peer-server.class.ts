import { BehaviorSubject, Subject, async, map, skip, take } from "rxjs";

export class P2PServer {

    private peerConnection?: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;
    private _messages: string[] = [];

    public channelOpened$ = new BehaviorSubject<boolean>(false);
    public messageReceived$ = new Subject<string>();

    private localDescription$ = new BehaviorSubject<RTCSessionDescription | null | undefined>(undefined);
    private localCandidates$ = new BehaviorSubject<RTCIceCandidate[]>([]);

    public localCandidates = this.localCandidates$.pipe(map(candidates => candidates.map(o => JSON.stringify(o)).join('\n')));
    public localDescription = this.localDescription$.pipe(map(offer => JSON.stringify(offer)));


    get _localCandidates(): string[] {
        return !this.localCandidates$.value ? [] :
            this.localCandidates$.value.reduce((strArr: string[], candidate: RTCIceCandidate) => {
                strArr.push(JSON.stringify(candidate));
                return strArr;
            }, [] as string[]);
    }

    // START Server
    startServer() {
        this.peerConnection = new RTCPeerConnection();
        this.handleCandidateCreation();
        this.handleDataChannel();
        this.createlocalDescription();
    }

    handleCandidateCreation() {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const localCandidates = this.localCandidates$.value;
                localCandidates.push(event.candidate);
                this.localCandidates$.next(localCandidates);
                // this.localCandidates$ += JSON.stringify(event.candidate) + '\n';
            }
        };
    }

    handleDataChannel() {
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
    // END - Start Offer

    // Set Remote
    async setRemoteDescription(remoteDescription: string) {
        const remoteDesc = JSON.parse(remoteDescription);
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));
    }

    async addRemoteCandidates(remoteCandidates: string) {
        const candidates = remoteCandidates.trim().split('\n');
        candidates.forEach(async (candidate) => {
            if (candidate) {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
            }
        });
    }
    // END - Set Remote

    closeConnection(): void {
        this.peerConnection?.close();
    }

    sendMessage(inputMessage: string) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(inputMessage);
        }
    }
}


export class P2PClient {

    private peerConnection?: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;
    private _messages: string[] = [];

    public channelOpened$ = new BehaviorSubject<boolean>(false);
    public messageReceived$ = new Subject<string>();

    private localDescription$ = new BehaviorSubject<RTCSessionDescription | null | undefined>(undefined);
    private localCandidates$ = new BehaviorSubject<RTCIceCandidate[]>([]);

    public localCandidates = this.localCandidates$.pipe(map(candidates => candidates.map(o => JSON.stringify(o)).join('\n')));
    public localDescription = this.localDescription$.pipe(map(offer => JSON.stringify(offer)));

    startClient() {
        this.peerConnection = new RTCPeerConnection();

        this.handleCandidateCreation();

        this.handleDataChannel();
    }

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

    handleDataChannel() {
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
    // END - Set Remote

    sendMessage(inputMessage: string) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(inputMessage);
        }
    }
}
