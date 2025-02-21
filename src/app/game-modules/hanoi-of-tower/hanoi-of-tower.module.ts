import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HanoiOfTowerRoutingModule } from './hanoi-of-tower-routing.module';
import { HanoiOfTowerComponent } from './hanoi-of-tower/hanoi-of-tower.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [HanoiOfTowerComponent],
  imports: [
    CommonModule,
    FormsModule,
    HanoiOfTowerRoutingModule
  ]
})
export class HanoiOfTowerModule { }
