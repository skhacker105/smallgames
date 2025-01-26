import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnakeNLadderRoutingModule } from './snake-nladder-routing.module';
import { SnakeNLadderComponent } from './snake-nladder/snake-nladder.component';
import { ShortNamePipe } from '../../pipe/short-name.pipe';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
    SnakeNLadderComponent
  ],
  imports: [
    CommonModule,
    SnakeNLadderRoutingModule,
    ShortNamePipe,
    MatIconModule
  ]
})
export class SnakeNLadderModule { }
