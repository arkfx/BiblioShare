import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

interface Tokens {
  access: string;
  refresh: string;
}

export interface UsuarioPerfil {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  foto_perfil: string | null;
  cidade: string | null;
  estado: string | null;
  vinculo_verificado: boolean;
}

interface AutenticacaoResposta {
  usuario: UsuarioPerfil;
  tokens: Tokens;
}

@Injectable({
  providedIn: 'root',
})
export class AutenticacaoService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly storageKey = 'biblioshare.tokens';
  private tokens: Tokens | null = this.carregarTokens();
  private readonly usuarioSubject = new BehaviorSubject<UsuarioPerfil | null>(null);

  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  entrar(email: string, senha: string): Observable<UsuarioPerfil> {
    return this.http
      .post<AutenticacaoResposta>(`${this.baseUrl}/auth/login/`, { email, senha })
      .pipe(
        tap((resposta) => this.persistirSessao(resposta)),
        map((resposta) => resposta.usuario),
      );
  }

  registrar(payload: {
    username: string;
    email: string;
    senha: string;
    confirmarSenha: string;
  }): Observable<UsuarioPerfil> {
    return this.http
      .post<AutenticacaoResposta>(`${this.baseUrl}/auth/registro/`, {
        username: payload.username,
        email: payload.email,
        senha: payload.senha,
        confirmar_senha: payload.confirmarSenha,
      })
      .pipe(
        tap((resposta) => this.persistirSessao(resposta)),
        map((resposta) => resposta.usuario),
      );
  }

  obterPerfil(): Observable<UsuarioPerfil> {
    return this.http.get<UsuarioPerfil>(`${this.baseUrl}/auth/perfil/`).pipe(
      tap((usuario) => this.usuarioSubject.next(usuario)),
    );
  }

  atualizarPerfil(parcial: Partial<UsuarioPerfil>): Observable<UsuarioPerfil> {
    return this.http
      .patch<UsuarioPerfil>(`${this.baseUrl}/auth/perfil/`, parcial)
      .pipe(tap((usuario) => this.usuarioSubject.next(usuario)));
  }

  atualizarToken(): Observable<string> {
    if (!this.tokens?.refresh) {
      return throwError(() => new Error('Refresh token ausente'));
    }

    return this.http
      .post<{ access: string }>(`${this.baseUrl}/auth/token/refresh/`, {
        refresh: this.tokens.refresh,
      })
      .pipe(
        tap((dados) => this.salvarTokens({ access: dados.access, refresh: this.tokens!.refresh })),
        map((dados) => dados.access),
      );
  }

  obterTokenDeAcesso(): string | null {
    return this.tokens?.access ?? null;
  }

  estaAutenticado(): boolean {
    return !!this.tokens?.access;
  }

  limparSessao(): void {
    this.tokens = null;
    localStorage.removeItem(this.storageKey);
    this.usuarioSubject.next(null);
    this.router.navigate(['/entrar']);
  }

  deveAnexarToken(urlRequisicao: string): boolean {
    const caminhosAnonimos = ['/auth/login/', '/auth/registro/', '/auth/token/refresh/'];
    return !caminhosAnonimos.some((caminho) => urlRequisicao.includes(caminho));
  }

  private persistirSessao(resposta: AutenticacaoResposta): void {
    this.salvarTokens(resposta.tokens);
    this.usuarioSubject.next(resposta.usuario);
  }

  private salvarTokens(tokens: Tokens): void {
    this.tokens = tokens;
    localStorage.setItem(this.storageKey, JSON.stringify(tokens));
  }

  private carregarTokens(): Tokens | null {
    const bruto = localStorage.getItem(this.storageKey);
    if (!bruto) {
      return null;
    }

    try {
      return JSON.parse(bruto) as Tokens;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}

