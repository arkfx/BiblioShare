import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { Livro, LivroPayload } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-detalhes-livro',
  templateUrl: './detalhes-livro.page.html',
  styleUrls: ['./detalhes-livro.page.scss'],
})
export class DetalhesLivroPage {
  formulario: FormGroup;
  livro?: Livro;
  carregando = false;
  salvando = false;
  removendo = false;
  readonly modalidades = [
    { valor: 'DOACAO', texto: 'Doação' },
    { valor: 'EMPRESTIMO', texto: 'Empréstimo' },
    { valor: 'ALUGUEL', texto: 'Aluguel' },
    { valor: 'TROCA', texto: 'Troca' },
  ];
  private readonly livroId: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    private readonly navController: NavController,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    this.livroId = Number(this.route.snapshot.paramMap.get('id'));
    this.formulario = this.formBuilder.group({
      isbn: [''],
      titulo: ['', Validators.required],
      autor: [''],
      editora: [''],
      ano_publicacao: [''],
      capa_url: [''],
      sinopse: [''],
      modalidades: [[], Validators.required],
      valor_aluguel_semanal: [null],
      prazo_emprestimo_dias: [null],
      disponivel: [true],
    });
  }

  ionViewWillEnter(): void {
    if (!this.livroId) {
      this.navController.back();
      return;
    }
    this.carregarLivro();
  }

  carregarLivro(): void {
    this.carregando = true;
    this.apiService
      .obter<Livro>(`livros/${this.livroId}/`)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (livro) => {
          this.livro = livro;
          this.preencherFormulario(livro);
        },
        error: async () => {
          await this.exibirToast('Livro não encontrado.', 'danger');
          this.navController.back();
        },
      });
  }

  atualizar(): void {
    if (this.formulario.invalid || !this.livro) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const payload = this.montarPayload();
    this.apiService
      .atualizar<Livro>(`livros/${this.livroId}/`, payload)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: async (livroAtualizado) => {
          this.livro = livroAtualizado;
          await this.exibirToast('Livro atualizado.', 'success');
        },
        error: async (erro) => {
          const mensagem = erro?.error?.detalhe ?? 'Não foi possível atualizar o livro.';
          await this.exibirToast(mensagem, 'danger');
        },
      });
  }

  async remover(): Promise<void> {
    if (!this.livro) {
      return;
    }

    const alerta = await this.alertController.create({
      header: 'Remover livro',
      message: 'Deseja remover este livro do inventário?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Remover',
          handler: () => this.confirmarRemocao(),
        },
      ],
    });
    await alerta.present();
  }

  private confirmarRemocao(): void {
    this.removendo = true;
    this.apiService
      .remover<void>(`livros/${this.livroId}/`)
      .pipe(finalize(() => (this.removendo = false)))
      .subscribe({
        next: async () => {
          await this.exibirToast('Livro removido.', 'success');
          this.navController.navigateBack('/meus-livros');
        },
        error: async () => {
          await this.exibirToast('Não foi possível remover o livro.', 'danger');
        },
      });
  }

  private preencherFormulario(livro: Livro): void {
    this.formulario.patchValue({
      isbn: livro.isbn,
      titulo: livro.titulo,
      autor: livro.autor,
      editora: livro.editora,
      ano_publicacao: livro.ano_publicacao,
      capa_url: livro.capa_url,
      sinopse: livro.sinopse,
      modalidades: livro.modalidades,
      valor_aluguel_semanal: livro.valor_aluguel_semanal,
      prazo_emprestimo_dias: livro.prazo_emprestimo_dias,
      disponivel: livro.disponivel,
    });
  }

  private montarPayload(): LivroPayload {
    const valores = this.formulario.value;
    return {
      isbn: valores.isbn ?? '',
      titulo: valores.titulo,
      autor: valores.autor ?? '',
      editora: valores.editora ?? '',
      ano_publicacao: valores.ano_publicacao ?? '',
      capa_url: valores.capa_url ?? '',
      sinopse: valores.sinopse ?? '',
      modalidades: valores.modalidades ?? [],
      valor_aluguel_semanal: valores.valor_aluguel_semanal
        ? Number(valores.valor_aluguel_semanal)
        : null,
      prazo_emprestimo_dias: valores.prazo_emprestimo_dias
        ? Number(valores.prazo_emprestimo_dias)
        : null,
      disponivel: valores.disponivel ?? true,
    };
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' | 'warning' = 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

