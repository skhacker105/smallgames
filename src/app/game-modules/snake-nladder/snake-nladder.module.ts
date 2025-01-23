import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnakeNLadderRoutingModule } from './snake-nladder-routing.module';
import { SnakeNLadderComponent } from './snake-nladder/snake-nladder.component';


@NgModule({
  declarations: [
    SnakeNLadderComponent
  ],
  imports: [
    CommonModule,
    SnakeNLadderRoutingModule
  ]
})
export class SnakeNLadderModule { }
