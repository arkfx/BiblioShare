import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MeusLivrosPageRoutingModule } from './meus-livros-routing.module';

import { MeusLivrosPage } from './meus-livros.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MeusLivrosPageRoutingModule,
    MeusLivrosPage,
  ],
})
export class MeusLivrosPageModule {}
