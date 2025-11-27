export type TransacaoTipo = 'DOACAO' | 'EMPRESTIMO' | 'ALUGUEL' | 'TROCA';

export type TransacaoStatus = 'PENDENTE' | 'ACEITA' | 'EM_POSSE' | 'CONCLUIDA' | 'CANCELADA';

export interface TransacaoUsuarioResumo {
  id: number;
  nome_completo: string;
  cidade: string | null;
  estado: string | null;
}

export interface TransacaoLivroResumo {
  id: number;
  titulo: string;
  autor: string;
  modalidades: string[];
  dono_nome: string;
  dono_cidade: string | null;
  dono_estado: string | null;
}

export interface Transacao {
  id: number;
  tipo: TransacaoTipo;
  status: TransacaoStatus;
  solicitante: TransacaoUsuarioResumo;
  dono: TransacaoUsuarioResumo;
  livro_principal: TransacaoLivroResumo;
  livros_oferecidos: TransacaoLivroResumo[];
  livros_solicitados: TransacaoLivroResumo[];
  data_limite_devolucao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CriarTransacaoPayload {
  tipo: TransacaoTipo;
  livro_principal: number;
  livros_oferecidos_ids?: number[];
  livros_solicitados_ids?: number[];
  data_limite_devolucao?: string | null;
}

export interface TransacaoAcaoResposta extends Transacao {}


