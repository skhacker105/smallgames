import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConnectingDotsRoutingModule } from './connecting-dots-routing.module';
import { ConnectingDotsComponent } from './connecting-dots/connecting-dots.component';
import { FormsModule } from '@angular/forms';
import { SecondsToHMSPipe } from '../../pipe/seconds-to-hms.pipe';


@NgModule({
  declarations: [
    ConnectingDotsComponent
  ],
  imports: [
    CommonModule,
    ConnectingDotsRoutingModule,
    FormsModule,
    SecondsToHMSPipe
  ]
})
export class ConnectingDotsModule { }
