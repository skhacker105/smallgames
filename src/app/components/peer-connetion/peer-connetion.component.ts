import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Camera, CameraResultType } from '@capacitor/camera';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { P2PClient, P2PServer } from '../../classes';
import { Subject, combineLatest, skip, takeUntil } from 'rxjs';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';

type TabType = 'server' | 'client';

// interface ITabData {
//   localOffer: string;
//   remoteOffer: string;
//   localICECandidate: string;
//   remoteICECandidate: string;
// }

interface ITab {
  type: TabType;
  header: string;
  fileName: string;
}

@Component({
  selector: 'app-peer-connetion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTabsModule, QRCodeModule],
  templateUrl: './peer-connetion.component.html',
  styleUrl: './peer-connetion.component.scss'
})
export class PeerConnetionComponent {

  @ViewChild('qrcode', { static: false }) qrCodeElement!: QRCodeComponent;

  componentIsActive = new Subject<boolean>();
  divider = '________';
  scanError = '';
  messages: string[] = [];

  tabs: ITab[] = [
    {
      type: 'server',
      header: 'Create Room',
      fileName: 'qr1.png'

    },
    {
      type: 'client',
      header: 'Join Room',
      fileName: 'qr2.png'
    }
  ];
  objServer?: P2PServer;
  objClient?: P2PClient;

  formGroup?: FormGroup;
  selectedTabId = 0;
  localDescription = '';
  private localCandiate = '';

  get selectedTab(): ITab {
    return this.tabs[this.selectedTabId];
  }

  get isServer(): boolean {
    return this.selectedTab.type === 'server';
  }

  get localDataAsQRCodeText(): string {
    return this.localDescription + this.divider + this.localCandiate;
  }


  constructor(public dialogRef: MatDialogRef<PeerConnetionComponent>) { }

  ngOnDestroy(): void {
    this.componentIsActive.next(true);
    this.componentIsActive.complete();
  }

  startServer(): void {
    this.objServer = new P2PServer();
    combineLatest([this.objServer.localDescription, this.objServer.localCandidates])
      .pipe(takeUntil(this.componentIsActive))
      .subscribe(response => {
        console.log('response = ', response, this.objServer?._localCandidates);
        this.localDescription = response[0];
        this.localCandiate = response[1];
      });
    this.objServer.startServer();
  }

  async scanQRCode(tabType: TabType) {
    this.scanError = ''
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri
      });

      const text = await this.readQRCode(image.webPath!);
      console.log('text = ', text)

      if (text)
        this.handleScannedText(text, tabType);
      else
        this.scanError = 'QR Code Not Found'
    } catch (error) {
      this.scanError = 'Error in reading image.'
      console.error('Error scanning QR code:', error);
    }
  }

  async readQRCode(webPath: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const codeReader = new BrowserQRCodeReader();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = webPath;

        img.onload = async () => {
          // Create a canvas and draw the image to ensure proper dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Canvas rendering context not supported');
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          try {
            // Use the canvas to decode the QR code
            const qrCodeResult = await codeReader.decodeFromCanvas(canvas);
            resolve(qrCodeResult.getText());
          } catch (error) {
            reject(`Error scanning QR code: ${error}`);
          }
        };

        img.onerror = (error) => reject(`Error loading image: ${error}`);
      } catch (error) {
        reject(`Error scanning QR code: ${error}`);
      }
    });
  }

  handleScannedText(scannedText: string, tabType: TabType): void {
    console.log('tabType = ', tabType)
    const [remoteOffer, remoteCandidate] = scannedText.split(this.divider);
    if (tabType === 'client') this.startClient(remoteOffer, remoteCandidate);
    else this.setClientOnServer(remoteOffer, remoteCandidate);
  }

  startClient(remoteOffer: string, remoteCandidate: string): void {
    this.objClient = new P2PClient();

    this.objClient.messageReceived$.pipe(takeUntil(this.componentIsActive))
      .subscribe(message => {
        console.log('message = ', message)
        this.messages.push(message);
        setTimeout(() => {
          this.objServer?.sendMessage((+message + 1).toString())
        }, 3000);
      });
    combineLatest([this.objClient.localDescription, this.objClient.localCandidates])
      .pipe(takeUntil(this.componentIsActive), skip(2))
      .subscribe(response => {
        console.log('response', response)
        this.localDescription = response[0];
        this.localCandiate = response[1];
      });

    this.objClient.startClient(remoteOffer, remoteCandidate);
  }

  setClientOnServer(remoteOffer: string, remoteCandidate: string) {
    console.log('remoteOffer = ', remoteOffer)
    console.log('remoteCandidate = ', remoteCandidate)
    console.log('objServer = ', this.objServer)
    if (!this.objServer) return;

    this.objServer.messageReceived$.pipe(takeUntil(this.componentIsActive))
      .subscribe(message => {
        console.log('message = ', message)
        this.messages.push(message);
        setTimeout(() => {
          this.objServer?.sendMessage((+message + 1).toString())
        }, 3000);
      });
    this.objServer.setRemote(remoteOffer, remoteCandidate);
    setTimeout(() => {
      this.objServer?.sendMessage('1');
    }, 3000);
  }

  downloadQRCode() {
    setTimeout(() => { // Ensure QR code is fully rendered
      const qrCanvas = this.qrCodeElement.qrcElement.nativeElement.querySelector('canvas');

      if (qrCanvas) {
        const imageUrl = qrCanvas.toDataURL('image/png'); // Convert to PNG format

        // Create a download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = this.selectedTab.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 500); // Delay to allow QR code rendering
  }

  // private peerConnection?: RTCPeerConnection;
  // private dataChannel?: RTCDataChannel;
  // localDescription: string = '';
  // remoteDescription: string = '';
  // localCandidates: string = '';
  // remoteCandidates: string = '';
  // message: string = '';
  // inputMessage: string = '';

  // constructor(public dialogRef: MatDialogRef<PeerConnetionComponent>) { }

  // // Start the "server" (initiator)
  // startServer() {
  //   this.peerConnection = new RTCPeerConnection();

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       this.localCandidates += JSON.stringify(event.candidate) + '\n';
  //       console.log('this.localCandidates = ', this.localCandidates)
  //     }
  //   };

  //   this.dataChannel = this.peerConnection.createDataChannel('chat');
  //   this.dataChannel.onopen = () => {
  //     this.message = 'Data channel opened!';
  //   };
  //   this.dataChannel.onmessage = (event) => {
  //     this.message = `Received: ${event.data}`;
  //   };

  //   this.peerConnection.createOffer().then((offer) => {
  //     return this.peerConnection?.setLocalDescription(offer);
  //   }).then(() => {
  //     this.localDescription = JSON.stringify(this.peerConnection?.localDescription);
  //   });
  // }

  // // Start the "client" (receiver)
  // startClient() {
  //   this.peerConnection = new RTCPeerConnection();

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       this.localCandidates += JSON.stringify(event.candidate) + '\n';
  //     }
  //   };

  //   this.peerConnection.ondatachannel = (event) => {
  //     this.dataChannel = event.channel;
  //     this.dataChannel.onopen = () => {
  //       this.message = 'Data channel opened!';
  //     };
  //     this.dataChannel.onmessage = (event) => {
  //       this.message = `Received: ${event.data}`;
  //     };
  //   };
  // }

  // // Set the remote description (offer/answer)
  // setRemoteDescription() {
  //   const remoteDesc = JSON.parse(this.remoteDescription);
  //   this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));

  //   if (remoteDesc.type === 'offer') {
  //     this.peerConnection?.createAnswer().then((answer) => {
  //       return this.peerConnection?.setLocalDescription(answer);
  //     }).then(() => {
  //       this.localDescription = JSON.stringify(this.peerConnection?.localDescription);
  //     });
  //   }
  // }

  // // Add remote ICE candidates
  // addRemoteCandidates() {
  //   const candidates = this.remoteCandidates.trim().split('\n');
  //   candidates.forEach((candidate) => {
  //     if (candidate) {
  //       this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
  //     }
  //   });
  // }

  // // Send a message over the data channel
  // sendMessage() {
  //   if (this.dataChannel && this.dataChannel.readyState === 'open') {
  //     this.dataChannel.send(this.inputMessage);
  //     this.inputMessage = '';
  //   }
  // }

}
