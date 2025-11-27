import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MensagemTransacao } from '../modelos/transacoes';

type MensagensResposta =
  | MensagemTransacao[]
  | {
      results?: MensagemTransacao[];
    };

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  listarMensagens(transacaoId: number, depoisDeId?: number): Observable<MensagemTransacao[]> {
    const url = `${this.baseUrl}/transacoes/${transacaoId}/mensagens/`;
    let params = new HttpParams();
    if (depoisDeId) {
      params = params.set('depois_de', depoisDeId);
    }
    return this.http.get<MensagensResposta>(url, { params }).pipe(
      map((payload) => {
        if (Array.isArray(payload)) {
          return payload;
        }
        return payload?.results ?? [];
      }),
    );
  }

  enviarMensagem(transacaoId: number, conteudo: string): Observable<MensagemTransacao> {
    const url = `${this.baseUrl}/transacoes/${transacaoId}/mensagens/`;
    return this.http.post<MensagemTransacao>(url, { conteudo });
  }
}

