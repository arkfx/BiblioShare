import { Component } from '@angular/core';

@Component({
  selector: 'app-transacoes',
  templateUrl: './transacoes.page.html',
  styleUrls: ['./transacoes.page.scss'],
})
export class TransacoesPage {
  transacoes = [
    { titulo: 'Engenheiros do Amanhã', status: 'Pendente', tipo: 'Troca' },
    { titulo: 'Administração Ágil', status: 'Aceita', tipo: 'Aluguel' },
    { titulo: 'Arte da Negociação', status: 'Em posse', tipo: 'Empréstimo' },
  ];
}
