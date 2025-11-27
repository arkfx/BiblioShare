import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { AutenticacaoService, UsuarioPerfil } from '../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class PerfilPage {
  formulario: FormGroup;
  usuario: UsuarioPerfil | null = null;
  carregandoPerfil = false;
  salvando = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly toastController: ToastController,
  ) {
    this.formulario = this.formBuilder.group({
      first_name: [''],
      last_name: [''],
      cidade: [''],
      estado: [''],
    });
  }

  ionViewWillEnter(): void {
    this.carregarPerfil();
  }

  carregarPerfil(event?: CustomEvent): void {
    this.carregandoPerfil = true;
    this.autenticacaoService
      .obterPerfil()
      .pipe(
        finalize(() => {
          this.carregandoPerfil = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (perfil) => {
          this.usuario = perfil;
          this.formulario.patchValue({
            first_name: perfil.first_name,
            last_name: perfil.last_name,
            cidade: perfil.cidade,
            estado: perfil.estado,
          });
        },
        error: async () => {
          await this.exibirToast('Não foi possível carregar seus dados.', 'danger');
        },
      });
  }

  atualizarPerfil(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.autenticacaoService
      .atualizarPerfil(this.formulario.value)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: (perfil) => {
          this.usuario = perfil;
          this.exibirToast('Perfil atualizado com sucesso!', 'success');
        },
        error: async () => {
          await this.exibirToast('Erro ao atualizar perfil.', 'danger');
        },
      });
  }

  private async exibirToast(mensagem: string, cor: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}
