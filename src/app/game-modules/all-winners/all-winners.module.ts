import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllWinnersRoutingModule } from './all-winners-routing.module';
import { AllWinnersComponent } from './all-winners/all-winners.component';

import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


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
    MatCheckboxModule
  ]
})
export class AllWinnersModule { }
