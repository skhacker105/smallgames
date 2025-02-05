import { BehaviorSubject, Subject, map, skip, take } from "rxjs";

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
            console.log('c = ', candidate);
            console.log('candidate = ', JSON.stringify(candidate))
            strArr.push(JSON.stringify(candidate));
            return strArr;
        }, [] as string[]);
    }

    // START Server
    startServer() {
        // console.log('starting peer connection')
        this.peerConnection = new RTCPeerConnection();
        this.handleCandidateCreation();
        this.handleDataChannel();
        this.createlocalDescription();
    }

    handleCandidateCreation() {
        // console.log('handleCandidateCreation', this.peerConnection)
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const localCandidates = this.localCandidates$.value;
                localCandidates.push(event.candidate);
                this.localCandidates$.next(localCandidates);
                console.log('this.localCandidates$', this.localCandidates$.value)
                // this.localCandidates$ += JSON.stringify(event.candidate) + '\n';
            }
        };
    }

    handleDataChannel() {
        // console.log('handleDataChannel', this.peerConnection)
        if (!this.peerConnection) return;

        this.dataChannel = this.peerConnection.createDataChannel('chat');
        this.dataChannel.onopen = () => {
            this.channelOpened$.next(true);
            console.log('Connection Opened')
            // this.message = 'Data channel opened!';
        };
        this.dataChannel.onmessage = (event) => {
            console.log('message received = ', event.data)
            this._messages.push(event.data);
            this.messageReceived$.next(event.data);
            // this.message = `Received: ${event.data}`;
        };
    }

    async createlocalDescription() {
        // console.log('createlocalDescription', this.peerConnection)
        if (!this.peerConnection) return;

        this.peerConnection.createOffer().then((offer) => {
            return this.peerConnection?.setLocalDescription(offer);
        }).then(() => {
            if (!this.peerConnection) return;

            // console.log('this.peerConnection.localDescription', this.peerConnection.localDescription)
            this.localDescription$.next(this.peerConnection.localDescription)
            // this.localDescription = JSON.stringify(this.peerConnection?.localDescription);
        });
    }
    // END - Start Offer

    // Set Remote
    setRemote(remoteDescription: string, remoteCandidate: string) {
        this.setRemoteDescription(remoteDescription).then(() => {
            this.addRemoteCandidates(remoteCandidate);
        });
    }

    async setRemoteDescription(remoteDescription: string) {
        const remoteDesc = JSON.parse(remoteDescription);
        console.log({ remoteDesc })
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        // if (remoteDesc.type === 'offer') {
        //     this.peerConnection?.createAnswer().then((answer) => {
        //         return this.peerConnection?.setLocalDescription(answer);
        //     }).then(() => {
        //         this.localDescription$.next(this.peerConnection?.localDescription);
        //     });
        // }
    }

    addRemoteCandidates(remoteCandidates: string) {
        const candidates = remoteCandidates.trim().split('\n');
        console.log({ candidates })
        candidates.forEach((candidate) => {
            if (candidate) {
                console.log({ candidate })
                this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
            }
        });
    }
    // END - Set Remote

    closeConnection(): void {
        this.peerConnection?.close();
    }

    sendMessage(inputMessage: string) {
        console.log('inputMessage = ', inputMessage)
        console.log('this.dataChannel.readyState = ', this.dataChannel?.readyState)
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

    
    get _localCandidates(): string[] {
        return !this.localCandidates$.value ? [] :
        this.localCandidates$.value.reduce((strArr: string[], candidate: RTCIceCandidate) => {
            console.log('c = ', candidate);
            strArr.push(JSON.stringify(candidate));
            return strArr;
        }, [] as string[]);
    }

    startClient(remoteDescription: string, remoteCandidate: string) {
        this.peerConnection = new RTCPeerConnection();
        console.log('this.peerConnection = ', this.peerConnection);

        this.handleCandidateCreation();

        this.handleDataChannel();
        this.setRemote(remoteDescription, remoteCandidate);
    }

    handleCandidateCreation() {
        // console.log('handleCandidateCreation', this.peerConnection)
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const localCandidates = this.localCandidates$.value;
                localCandidates.push(event.candidate);
                this.localCandidates$.next(localCandidates);
                console.log('this.localCandidates$', this.localCandidates$.value)
                // this.localCandidates$ += JSON.stringify(event.candidate) + '\n';
            }
        };
    }

    handleDataChannel() {
        // console.log('handleDataChannel', this.peerConnection)
        if (!this.peerConnection) return;

        this.dataChannel = this.peerConnection.createDataChannel('chat');
        this.dataChannel.onopen = () => {
            this.channelOpened$.next(true);
            console.log('Connection Opened')
            // this.message = 'Data channel opened!';
        };
        this.dataChannel.onmessage = (event) => {
            console.log('message received = ', event.data)
            this._messages.push(event.data);
            this.messageReceived$.next(event.data);
            // this.message = `Received: ${event.data}`;
        };
    }

    // Set Remote
    async setRemote(remoteDescription: string, remoteCandidate: string) {

        await this.setRemoteDescription(remoteDescription);
        await this.addRemoteCandidates(remoteCandidate);
    }

    async setRemoteDescription(remoteDescription: string) {
        const remoteDesc = JSON.parse(remoteDescription);
        console.log('remoteDesc = ', remoteDesc, new RTCSessionDescription(remoteDesc))
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));

        if (remoteDesc.type === 'offer') {
            const answer = await this.peerConnection?.createAnswer();
            await this.peerConnection?.setLocalDescription(answer);
            this.localDescription$.next(this.peerConnection?.localDescription);
            console.log('this.localDescription$ = ', this.localDescription$.value)


            // this.peerConnection?.createAnswer().then((answer) => {
            //     return this.peerConnection?.setLocalDescription(answer);
            // }).then(() => {
            //     this.localDescription$.next(this.peerConnection?.localDescription);
            //     console.log('this.localDescription$ = ', this.localDescription$.value)
            // });
        }
    }

    async addRemoteCandidates(remoteCandidates: string) {
        const candidates = remoteCandidates.trim().split('\n');
        console.log('candidates = ', candidates)
        candidates.forEach(async (candidate) => {
            if (candidate) {
                console.log('candidate = ', JSON.parse(candidate))
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
            }
        });
        setTimeout(() => {
            this.sendMessage('0')
        }, 10000);
    }
    // END - Set Remote

    sendMessage(inputMessage: string) {
        console.log('inputMessage = ', inputMessage)
        console.log('this.dataChannel.readyState = ', this.dataChannel?.readyState)
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(inputMessage);
        }
    }
}
