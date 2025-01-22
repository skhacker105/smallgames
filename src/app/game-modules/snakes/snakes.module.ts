import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnakesRoutingModule } from './snakes-routing.module';
import { SnakesComponent } from './snakes/snakes.component';


@NgModule({
  declarations: [
    SnakesComponent
  ],
  imports: [
    CommonModule,
    SnakesRoutingModule
  ]
})
export class SnakesModule { }
