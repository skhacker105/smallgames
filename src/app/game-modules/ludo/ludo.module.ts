import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LudoRoutingModule } from './ludo-routing.module';
import { LudoComponent } from './ludo/ludo.component';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
  
    LudoComponent
  ],
  imports: [
    CommonModule,
    LudoRoutingModule,
    MatIconModule
  ]
})
export class LudoModule { }
