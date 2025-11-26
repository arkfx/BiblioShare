export interface Livro {
  id: number;
  dono: number;
  dono_cidade?: string | null;
  dono_estado?: string | null;
  isbn: string;
  titulo: string;
  autor: string;
  editora: string;
  ano_publicacao: string;
  capa_url: string;
  sinopse: string;
  modalidades: string[];
  valor_aluguel_semanal: string | number | null;
  prazo_emprestimo_dias: number | null;
  disponivel: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type LivroPayload = Omit<Livro, 'id' | 'dono' | 'criado_em' | 'atualizado_em'>;

export interface ListaDesejoItem {
  id: number;
  titulo: string | null;
  autor: string | null;
  isbn: string | null;
  criado_em: string;
}

