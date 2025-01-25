import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnakeNLadderRoutingModule } from './snake-nladder-routing.module';
import { SnakeNLadderComponent } from './snake-nladder/snake-nladder.component';
import { ShortNamePipe } from '../../pipe/short-name.pipe';


@NgModule({
  declarations: [
    SnakeNLadderComponent
  ],
  imports: [
    CommonModule,
    SnakeNLadderRoutingModule,
    ShortNamePipe
  ]
})
export class SnakeNLadderModule { }
