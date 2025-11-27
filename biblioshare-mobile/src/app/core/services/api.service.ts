import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Livro } from '../modelos/livros';
import {
  CriarTransacaoPayload,
  Transacao,
} from '../modelos/transacoes';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  obter<T>(caminho: string, parametros?: Record<string, string | number | boolean>): Observable<T> {
    const url = this.montarUrl(caminho);
    const params = this.criarParametros(parametros);
    return this.http.get<T>(url, { params });
  }

  criar<T>(caminho: string, corpo: unknown): Observable<T> {
    const url = this.montarUrl(caminho);
    return this.http.post<T>(url, corpo);
  }

  atualizar<T>(caminho: string, corpo: unknown): Observable<T> {
    const url = this.montarUrl(caminho);
    return this.http.patch<T>(url, corpo);
  }

  remover<T>(caminho: string): Observable<T> {
    const url = this.montarUrl(caminho);
    return this.http.delete<T>(url);
  }

  buscarLivros(parametros?: Record<string, string | number | boolean>): Observable<Livro[]> {
    return this.obter<Livro[]>('livros/buscar/', parametros);
  }

  obterLivroOferta(id: number): Observable<Livro> {
    return this.obter<Livro>(`livros/oferta/${id}/`);
  }

  listarTransacoes(parametros?: Record<string, string | number | boolean>): Observable<Transacao[]> {
    return this.obter<Transacao[]>('transacoes/', parametros);
  }

  obterTransacao(id: number): Observable<Transacao> {
    return this.obter<Transacao>(`transacoes/${id}/`);
  }

  criarTransacao(payload: CriarTransacaoPayload): Observable<Transacao> {
    return this.criar<Transacao>('transacoes/', payload);
  }

  aceitarTransacao(id: number): Observable<Transacao> {
    return this.criar<Transacao>(`transacoes/${id}/aceitar/`, {});
  }

  recusarTransacao(id: number): Observable<Transacao> {
    return this.criar<Transacao>(`transacoes/${id}/recusar/`, {});
  }

  cancelarTransacao(id: number): Observable<Transacao> {
    return this.criar<Transacao>(`transacoes/${id}/cancelar/`, {});
  }

  private montarUrl(caminho: string): string {
    const caminhoLimpo = caminho.replace(/^\/+/, '');
    return `${this.baseUrl}/${caminhoLimpo}`;
  }

  private criarParametros(parametros?: Record<string, string | number | boolean>): HttpParams | undefined {
    if (!parametros) {
      return undefined;
    }

    let params = new HttpParams();
    Object.entries(parametros).forEach(([chave, valor]) => {
      params = params.set(chave, String(valor));
    });
    return params;
  }
}

