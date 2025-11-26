import { Component } from '@angular/core';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {
  usuario = {
    nome: 'Camila Souza',
    email: 'camila@universidade.br',
    bairro: 'Funcionários',
    livrosDisponiveis: 18,
  };
}
