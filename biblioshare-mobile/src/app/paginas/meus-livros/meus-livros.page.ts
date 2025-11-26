import { Component } from '@angular/core';

@Component({
  selector: 'app-meus-livros',
  templateUrl: './meus-livros.page.html',
  styleUrls: ['./meus-livros.page.scss'],
})
export class MeusLivrosPage {
  livrosExemplo = [
    { titulo: 'Introdução ao Django', modalidade: 'Empréstimo', disponibilidade: 'Disponível' },
    { titulo: 'Arquitetura Limpa', modalidade: 'Troca', disponibilidade: 'Reservado' },
    { titulo: 'Mapas e Dados Geográficos', modalidade: 'Doação', disponibilidade: 'Disponível' },
  ];

  constructor() {}
}
