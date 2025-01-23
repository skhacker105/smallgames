import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LudoRoutingModule } from './ludo-routing.module';
import { LudoComponent } from './ludo/ludo.component';


@NgModule({
  declarations: [
  
    LudoComponent
  ],
  imports: [
    CommonModule,
    LudoRoutingModule
  ]
})
export class LudoModule { }
