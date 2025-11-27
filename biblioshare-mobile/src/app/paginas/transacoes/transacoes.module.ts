import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TransacoesPageRoutingModule } from './transacoes-routing.module';

import { TransacoesPage } from './transacoes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TransacoesPageRoutingModule,
    TransacoesPage,
  ],
})
export class TransacoesPageModule {}
