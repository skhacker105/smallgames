import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SnakesRoutingModule } from './snakes-routing.module';
import { SnakesComponent } from './snakes/snakes.component';
import { SwipeDirectionDirective } from '../../directives';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    SnakesComponent
  ],
  imports: [
    CommonModule,
    SnakesRoutingModule,
    SwipeDirectionDirective,
    MatDialogModule
  ]
})
export class SnakesModule { }
