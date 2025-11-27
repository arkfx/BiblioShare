import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BuscaPageRoutingModule } from './busca-routing.module';

import { BuscaPage } from './busca.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BuscaPageRoutingModule,
    BuscaPage,
  ],
})
export class BuscaPageModule {}
