import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { Livro } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';
import {
  AutenticacaoService,
  UsuarioPerfil,
} from '../../core/services/autenticacao.service';
import { CriarTransacaoPayload } from '../../core/modelos/transacoes';

type ModalidadeSimples = 'DOACAO' | 'EMPRESTIMO' | 'ALUGUEL';

@Component({
  standalone: true,
  selector: 'app-oferta-livro',
  templateUrl: './oferta-livro.page.html',
  styleUrls: ['./oferta-livro.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
})
export class OfertaLivroPage {
  livro?: Livro;
  carregando = false;
  enviando = false;
  usuario?: UsuarioPerfil | null;
  dataLimiteEmprestimo = '';
  dataLimiteAluguel = '';
  private readonly livroId: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly toastController: ToastController,
    private readonly navController: NavController,
    private readonly autenticacaoService: AutenticacaoService,
  ) {
    this.livroId = Number(this.route.snapshot.paramMap.get('id'));
    const livroEstado = this.router.getCurrentNavigation()?.extras?.state?.['livro'] as Livro | undefined;
    if (livroEstado) {
      this.livro = livroEstado;
    }
  }

  ionViewWillEnter(): void {
    this.garantirPerfil();
    this.carregarLivro();
  }

  get ehDono(): boolean {
    return !!(this.usuario && this.livro && this.usuario.id === this.livro.dono);
  }

  temModalidade(modalidade: ModalidadeSimples | 'TROCA'): boolean {
    return !!this.livro?.modalidades?.includes(modalidade);
  }

  rotuloModalidade(modalidade: string): string {
    const mapa: Record<string, string> = {
      DOACAO: 'Doação',
      EMPRESTIMO: 'Empréstimo',
      ALUGUEL: 'Aluguel',
      TROCA: 'Troca',
    };
    return mapa[modalidade] ?? modalidade;
  }

  solicitar(tipo: ModalidadeSimples): void {
    if (!this.livro || this.ehDono) {
      return;
    }
    this.enviando = true;
    const payload: CriarTransacaoPayload = {
      tipo,
      livro_principal: this.livro.id,
    };
    const dataLimite =
      tipo === 'EMPRESTIMO'
        ? this.dataLimiteEmprestimo
        : tipo === 'ALUGUEL'
          ? this.dataLimiteAluguel
          : '';
    if (dataLimite) {
      payload.data_limite_devolucao = dataLimite;
    }

    this.apiService
      .criarTransacao(payload)
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: async (transacao) => {
          await this.exibirToast('Solicitação enviada!', 'success');
          this.navController.navigateForward(`/transacoes/detalhes/${transacao.id}`);
        },
        error: async (erro) => {
          const mensagem = erro?.error?.detail ?? erro?.error ?? 'Não foi possível enviar a solicitação.';
          await this.exibirToast(mensagem);
        },
      });
  }

  proporTroca(): void {
    if (!this.livro || !this.temModalidade('TROCA') || this.ehDono) {
      return;
    }
    this.router.navigate(['/transacoes/propor-troca', this.livro.id], {
      state: { livro: this.livro },
    });
  }

  async voltarParaBusca(): Promise<void> {
    await this.navController.back();
  }

  private carregarLivro(): void {
    if (!this.livroId) {
      this.navController.back();
      return;
    }
    this.carregando = true;
    this.apiService
      .obterLivroOferta(this.livroId)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (livro) => {
          this.livro = livro;
        },
        error: async () => {
          await this.exibirToast('Livro não disponível no momento.');
          this.navController.back();
        },
      });
  }

  private garantirPerfil(): void {
    if (!this.autenticacaoService.estaAutenticado()) {
      return;
    }
    const atual = this.autenticacaoService.obterUsuarioAtual();
    if (atual) {
      this.usuario = atual;
      return;
    }
    this.autenticacaoService
      .obterPerfil()
      .subscribe((perfil) => (this.usuario = perfil));
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' = 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

