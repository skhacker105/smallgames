import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';
import { GameDashboardIconComponent } from '../../components/game-dashboard-icon/game-dashboard-icon.component';


@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    GameDashboardIconComponent
  ]
})
export class HomeModule { }
