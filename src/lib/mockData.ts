/**
 * DMC:    VIZ-00-00-00-300A
 * Título: Núcleo › Dados fictícios (até o Supabase entrar)
 * BREX:   VIZ-00-00-00-022A
 *
 * Cada `createStore` agora fala com `/api/<recurso>` por baixo (ver
 * `src/lib/store.ts`) — dado real, persistido no Postgres. Aqui só os
 * tipos, os stores e as regras de domínio (numeração, etapa,
 * notificações); o cenário de demonstração (se você quiser um banco de
 * dev populado) vive só no servidor, em `server/db/seedDemo.ts`, nunca
 * no bundle do cliente.
 */
import { createStore } from './store';
import { gerarId } from './id';

export function agora(): string {
  return new Date().toISOString();
}

export interface Obra {
  readonly id: string;
  readonly nome: string;
  readonly cliente: string;
  readonly endereco: string;
}

export const obrasStore = createStore<Obra>('obras');

export interface Fornecedor {
  readonly id: string;
  readonly nome: string;
  readonly cnpj: string;
  readonly telefone: string;
  readonly email: string;
  readonly formaPagamento: 'PIX' | 'Boleto' | 'Transferência';
  readonly chavePix: string;
}

export const fornecedoresStore = createStore<Fornecedor>('fornecedores');

export interface ItemCotacao {
  readonly item: string;
  readonly quantidade: number;
  readonly precoUnitario: number;
  readonly subtotal: number;
}

/**
 * Uma cotação importada = a resposta de UM fornecedor para o mapa de
 * cotação daquele orçamento (`orcamentoId`) — sem isso, cotações de
 * orçamentos diferentes se misturariam no mesmo comparativo. O
 * fornecedor só é identificado neste momento (ao importar), não antes
 * — pode ser um já cadastrado ou um criado na hora. Ver ImportarCotacaoPage.
 */
export interface CotacaoImportada {
  readonly id: string;
  readonly orcamentoId: string;
  readonly fornecedorId: string;
  readonly fornecedorNome: string;
  readonly arquivo: string;
  readonly frete: number;
  readonly itens: readonly ItemCotacao[];
}

export const cotacoesImportadasStore = createStore<CotacaoImportada>('cotacoes');

/**
 * Numeração do mapa de cotação — só o servidor pode gerar (precisa ser
 * única entre TODOS os usuários, não só nesta aba) — ver
 * `POST /api/orcamentos/:id/enviar-cotacao`. Único motivo pelo qual
 * "enviar para fornecedores" não é local-first como o resto.
 */
export async function obterCodigoCotacao(orcamentoId: string): Promise<string> {
  const resposta = await fetch(`/api/orcamentos/${orcamentoId}/enviar-cotacao`, { method: 'POST', credentials: 'include' });
  const dados = await resposta.json();
  return dados.codigoCotacao as string;
}

/** Item da requisição — descrição, quantidade e unidade pedidas pelo comprador. */
export interface ItemRequisicao {
  readonly descricao: string;
  readonly quantidade: string;
  readonly unidade: string;
}

/**
 * Um item do orçamento guarda o preço de CADA fornecedor cotado
 * naquele item (`porFornecedor`), não só o escolhido — é o que deixa
 * montar o comparativo no PDF do cliente depois (ver decisoes.md).
 * Congelado no momento em que o orçamento é montado a partir do
 * comparativo: se uma cotação mudar depois, o orçamento já emitido
 * não muda.
 */
export interface ItemOrcamento {
  readonly item: string;
  readonly porFornecedor: Readonly<Record<string, number>>;
  readonly fornecedorEscolhido: string;
  readonly pontoAtencao?: boolean;
}

/**
 * `rascunho`: com o comprador, editável, ainda não enviado para
 * aprovação. `em_aprovacao`: travado para o comprador, com o
 * engenheiro. `aprovado`: final, vai para o cliente. `reprovado`: só
 * existe como registro histórico — a versão seguinte sempre volta a
 * `rascunho` para o comprador corrigir (nunca fica como atual).
 */
export interface VersaoOrcamento {
  readonly versao: number;
  readonly status: 'rascunho' | 'em_aprovacao' | 'aprovado' | 'reprovado';
  readonly itens: readonly ItemOrcamento[];
  readonly totaisPorFornecedor: Readonly<Record<string, number>>;
  readonly frete: number;
  readonly criadaEm: string;
  readonly enviadaParaAprovacaoEm?: string;
  /** Quando o engenheiro aprovou ou reprovou esta versão. */
  readonly decididaEm?: string;
  readonly aprovadoPor?: string;
  readonly justificativa?: string;
  /** Preenchido quando esta versão nasce de uma edição num orçamento já aprovado (não de reprovação). */
  readonly editadoPor?: string;
  readonly notaEdicao?: string;
}

/**
 * Etapas antes de o orçamento existir como versão (`requisicao` →
 * `cotacao` → `comparativo`) mais os status da versão atual, depois
 * de montado — tudo num só lugar para a listagem e o filtro saberem
 * "em que pé está" o orçamento inteiro, do clique em "+ Novo
 * orçamento" até aprovado. Nunca regride sozinha: voltar numa etapa
 * anterior para editar não muda o progresso já alcançado, só
 * avançar (ver `avancarEtapa`).
 */
export type EtapaOrcamento =
  | 'requisicao' | 'cotacao' | 'comparativo' | 'rascunho' | 'em_aprovacao' | 'aprovado' | 'reprovado'
  | 'recebimento_parcial' | 'recebido';

const ORDEM_ETAPAS: readonly EtapaOrcamento[] = [
  'requisicao', 'cotacao', 'comparativo', 'rascunho', 'em_aprovacao', 'aprovado', 'recebimento_parcial', 'recebido',
];

export function rankEtapa(etapa: EtapaOrcamento): number {
  const indice = ORDEM_ETAPAS.indexOf(etapa === 'reprovado' ? 'rascunho' : etapa);
  return indice === -1 ? 0 : indice;
}

/**
 * Uma entrega de material na obra — o encarregado tira foto da nota
 * fiscal e marca quais itens chegaram. `itensRecebidos` guarda os
 * nomes dos itens (iguais aos de `ItemOrcamento.item`) entregues NESTA
 * entrega; várias entregas parciais vão se somando (ver
 * `statusRecebimento`) até o orçamento ficar `recebido`.
 */
export interface Recebimento {
  readonly id: string;
  readonly tipo: 'completo' | 'parcial';
  readonly itensRecebidos: readonly string[];
  readonly fotoNotaFiscal: string;
  readonly recebidoPor: string;
  readonly recebidoEm: string;
  readonly observacao?: string;
}

export interface Orcamento {
  readonly id: string;
  readonly codigo: string;
  /** Progresso mais avançado já alcançado — ver `EtapaOrcamento`. */
  readonly etapa: EtapaOrcamento;
  readonly obraId: string;
  readonly obraNome: string;
  readonly cliente: string;
  /** Nome de quem montou o orçamento — para notificar de volta se for reprovado. */
  readonly compradorResponsavel: string;
  /** Quando clicou em "+ Novo orçamento" — início da contagem do painel. */
  readonly criadoEm: string;
  readonly itensRequisicao: readonly ItemRequisicao[];
  readonly requisicaoValidada: boolean;
  readonly codigoCotacao?: string;
  readonly requisicaoEnviadaEm?: string;
  /** Quando o comparativo gerou a primeira versão deste orçamento. */
  readonly mapaMontadoEm?: string;
  readonly versoes: readonly VersaoOrcamento[];
  readonly recebimentos: readonly Recebimento[];
  readonly historico: readonly EventoHistorico[];
}

/**
 * Histórico de alterações do orçamento — por enquanto só item removido
 * (a única alteração que hoje exige justificativa), mas o `tipo` é
 * aberto pra outras entrarem depois sem mudar a forma do registro.
 * Nunca é editado nem apagado, só acrescentado (igual `recebimentos`).
 */
export interface EventoHistorico {
  readonly id: string;
  readonly tipo: 'item_removido';
  readonly descricao: string;
  readonly justificativa: string;
  readonly autor: string;
  readonly registradoEm: string;
}

export function registrarEventoHistorico(orcamento: Orcamento, dados: Omit<EventoHistorico, 'id'>): void {
  orcamentosStore.atualizar(orcamento.id, { historico: [...orcamento.historico, { ...dados, id: gerarId() }] });
}

/**
 * Etapa atual para exibir — usa o status da versão quando já existe
 * uma (e, se aprovada, o quanto já chegou na obra), senão o progresso
 * anterior ao orçamento existir.
 */
export function etapaAtual(orcamento: Orcamento): EtapaOrcamento {
  if (orcamento.versoes.length === 0) return orcamento.etapa;
  const status = versaoAtual(orcamento).status;
  return status === 'aprovado' ? statusRecebimento(orcamento) : status;
}

/** `aprovado` (nada chegou ainda), `recebimento_parcial` ou `recebido` (todos os itens já chegaram, em uma ou mais entregas). */
export function statusRecebimento(orcamento: Orcamento): EtapaOrcamento {
  const totalItens = versaoAtual(orcamento)?.itens.length ?? 0;
  if (totalItens === 0) return 'aprovado';
  const recebidos = new Set(orcamento.recebimentos.flatMap((r) => r.itensRecebidos));
  if (recebidos.size === 0) return 'aprovado';
  return recebidos.size >= totalItens ? 'recebido' : 'recebimento_parcial';
}

/** Registra uma entrega (completa ou parcial) — nunca substitui uma entrega anterior, só acrescenta. */
export function registrarRecebimento(orcamento: Orcamento, dados: Omit<Recebimento, 'id'>): void {
  orcamentosStore.atualizar(orcamento.id, { recebimentos: [...orcamento.recebimentos, { ...dados, id: gerarId() }] });
}

/** Só avança: nunca deixa o progresso retroceder por causa de uma edição numa etapa anterior. */
export function avancarEtapa(atual: EtapaOrcamento, proxima: EtapaOrcamento): EtapaOrcamento {
  return rankEtapa(proxima) > rankEtapa(atual) ? proxima : atual;
}

/**
 * Notificação entre engenheiro e comprador sobre um orçamento.
 * `usuarioDestino` filtra para quem montou aquele orçamento
 * especificamente; sem ele, todo o perfil vê (caso do engenheiro, que
 * não tem "dono" — qualquer um pode aprovar).
 */
export interface Notificacao {
  readonly id: string;
  readonly perfilDestino: 'Engenheiro' | 'Comprador';
  readonly usuarioDestino?: string;
  readonly mensagem: string;
  readonly orcamentoId: string;
  readonly criadaEm: string;
  readonly lida: boolean;
}

export const notificacoesStore = createStore<Notificacao>('notificacoes');

export const orcamentosStore = createStore<Orcamento>('orcamentos');

export function versaoAtual(orcamento: Orcamento): VersaoOrcamento {
  return orcamento.versoes[orcamento.versoes.length - 1];
}

/**
 * Cria o orçamento já no clique de "+ Novo orçamento" / "Nova
 * requisição" — ele passa a contar na listagem e no filtro desde esse
 * momento (etapa `requisicao`), antes mesmo de ter itens. Único método
 * de criação que não é local-first: o código (`OR-0001`) precisa ser
 * único entre todo mundo, então espera a resposta do servidor antes de
 * devolver o orçamento (`POST /api/orcamentos`).
 */
export async function criarOrcamento(compradorResponsavel: string, obra?: Obra): Promise<Orcamento> {
  const resposta = await fetch('/api/orcamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ compradorResponsavel, obraId: obra?.id, obraNome: obra?.nome, cliente: obra?.cliente }),
  });
  const { id, codigo } = (await resposta.json()) as { id: string; codigo: string };
  const orcamento: Orcamento = {
    id, codigo, etapa: 'requisicao',
    obraId: obra?.id ?? '', obraNome: obra?.nome ?? '', cliente: obra?.cliente ?? '',
    compradorResponsavel, criadoEm: agora(),
    itensRequisicao: [], requisicaoValidada: false,
    versoes: [], recebimentos: [], historico: [],
  };
  orcamentosStore.inserirLocal(orcamento);
  return orcamento;
}

export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly senha: string;
  readonly perfil: 'Master' | 'Engenheiro' | 'Comprador' | 'Encarregado';
  /** Só tem sentido pro Encarregado — obrigatório ter ao menos uma (ver NovoUsuarioPage). Outros perfis: `[]`. */
  readonly obrasIds: readonly string[];
}

export const usuariosStore = createStore<Usuario>('usuarios');
