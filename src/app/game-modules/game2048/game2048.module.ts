import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Game2048RoutingModule } from './game2048-routing.module';
import { Game2048Component } from './game2048/game2048.component';
import { SwipeDirectionDirective } from '../../directives';


@NgModule({
  declarations: [
    Game2048Component
  ],
  imports: [
    CommonModule,
    Game2048RoutingModule,
    SwipeDirectionDirective
  ]
})
export class Game2048Module { }
