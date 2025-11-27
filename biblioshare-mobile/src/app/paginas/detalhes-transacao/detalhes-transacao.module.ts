import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetalhesTransacaoPageRoutingModule } from './detalhes-transacao-routing.module';
import { DetalhesTransacaoPage } from './detalhes-transacao.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, DetalhesTransacaoPageRoutingModule],
  declarations: [DetalhesTransacaoPage],
})
export class DetalhesTransacaoPageModule {}

