import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PropostaTrocaPageRoutingModule } from './proposta-troca-routing.module';
import { PropostaTrocaPage } from './proposta-troca.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    PropostaTrocaPageRoutingModule,
    PropostaTrocaPage,
  ],
})
export class PropostaTrocaPageModule {}

