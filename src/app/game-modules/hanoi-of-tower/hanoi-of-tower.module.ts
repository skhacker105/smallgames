import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HanoiOfTowerRoutingModule } from './hanoi-of-tower-routing.module';
import { HanoiOfTowerComponent } from './hanoi-of-tower/hanoi-of-tower.component';


@NgModule({
  declarations: [HanoiOfTowerComponent],
  imports: [
    CommonModule,
    HanoiOfTowerRoutingModule
  ]
})
export class HanoiOfTowerModule { }
