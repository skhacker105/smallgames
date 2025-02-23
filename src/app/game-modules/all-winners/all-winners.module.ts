import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllWinnersRoutingModule } from './all-winners-routing.module';
import { AllWinnersComponent } from './all-winners/all-winners.component';

import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SecondsToHMSPipe } from '../../pipe/seconds-to-hms.pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AllWinnersComponent
  ],
  imports: [
    CommonModule,
    AllWinnersRoutingModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    SecondsToHMSPipe,
    MatDialogModule,
    FormsModule
  ]
})
export class AllWinnersModule { }
