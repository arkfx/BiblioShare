import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ListaDesejosPageRoutingModule } from './lista-desejos-routing.module';
import { ListaDesejosPage } from './lista-desejos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ListaDesejosPageRoutingModule,
    ListaDesejosPage,
  ],
})
export class ListaDesejosPageModule {}

