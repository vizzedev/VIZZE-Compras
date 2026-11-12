/**
 * DMC:    VIZ-00-00-00-600A
 * Título: Núcleo › Esquema do banco (Postgres/Supabase, Drizzle)
 * BREX:   VIZ-00-00-00-022A
 *
 * Uma tabela por entidade real do domínio — nunca jsonb genérico pra
 * fugir de modelar. As exceções (jsonb) são só pra estruturas que o
 * próprio app sempre lê/escreve inteiras, nunca por item (os itens de
 * uma versão de orçamento, os itens de uma cotação importada, os itens
 * de uma requisição, os itens recebidos numa entrega) — equivalente ao
 * que já eram arrays dentro do mesmo registro em `src/lib/mockData.ts`.
 * `id` é sempre o uuid que o CLIENTE já gerou (`gerarId()`, em
 * `src/lib/id.ts`) — o servidor nunca troca o id, só persiste.
 */
import { pgTable, text, boolean, timestamp, numeric, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usuarios = pgTable('usuarios', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  perfil: text('perfil').notNull(), // 'Master' | 'Engenheiro' | 'Comprador' | 'Encarregado'
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const usuariosObras = pgTable('usuarios_obras', {
  usuarioId: text('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  obraId: text('obra_id').notNull().references(() => obras.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.usuarioId, t.obraId] }),
}));

export const obras = pgTable('obras', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  cliente: text('cliente').notNull(),
  endereco: text('endereco').notNull(),
});

export const fornecedores = pgTable('fornecedores', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  cnpj: text('cnpj').notNull(),
  telefone: text('telefone').notNull(),
  email: text('email').notNull(),
  formaPagamento: text('forma_pagamento').notNull(), // 'PIX' | 'Boleto' | 'Transferência'
  chavePix: text('chave_pix').notNull().default(''),
});

export const orcamentos = pgTable('orcamentos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  etapa: text('etapa').notNull(),
  obraId: text('obra_id').references(() => obras.id, { onDelete: 'set null' }),
  obraNome: text('obra_nome').notNull().default(''),
  cliente: text('cliente').notNull().default(''),
  compradorResponsavel: text('comprador_responsavel').notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  itensRequisicao: jsonb('itens_requisicao').notNull().default([]),
  requisicaoValidada: boolean('requisicao_validada').notNull().default(false),
  codigoCotacao: text('codigo_cotacao'),
  requisicaoEnviadaEm: timestamp('requisicao_enviada_em', { withTimezone: true }),
  mapaMontadoEm: timestamp('mapa_montado_em', { withTimezone: true }),
});

export const versoesOrcamento = pgTable('versoes_orcamento', {
  id: text('id').primaryKey(),
  orcamentoId: text('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  versao: integer('versao').notNull(),
  status: text('status').notNull(), // 'rascunho' | 'em_aprovacao' | 'aprovado' | 'reprovado'
  itens: jsonb('itens').notNull().default([]),
  totaisPorFornecedor: jsonb('totais_por_fornecedor').notNull().default({}),
  frete: numeric('frete', { precision: 14, scale: 2 }).notNull().default('0'),
  criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  enviadaParaAprovacaoEm: timestamp('enviada_para_aprovacao_em', { withTimezone: true }),
  decididaEm: timestamp('decidida_em', { withTimezone: true }),
  aprovadoPor: text('aprovado_por'),
  justificativa: text('justificativa'),
  editadoPor: text('editado_por'),
  notaEdicao: text('nota_edicao'),
});

export const cotacoesImportadas = pgTable('cotacoes_importadas', {
  id: text('id').primaryKey(),
  orcamentoId: text('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  fornecedorId: text('fornecedor_id').references(() => fornecedores.id, { onDelete: 'set null' }),
  fornecedorNome: text('fornecedor_nome').notNull(),
  arquivo: text('arquivo').notNull().default(''),
  frete: numeric('frete', { precision: 14, scale: 2 }).notNull().default('0'),
  itens: jsonb('itens').notNull().default([]),
});

export const recebimentos = pgTable('recebimentos', {
  id: text('id').primaryKey(),
  orcamentoId: text('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(), // 'completo' | 'parcial'
  itensRecebidos: jsonb('itens_recebidos').notNull().default([]),
  fotoNotaFiscal: text('foto_nota_fiscal').notNull(),
  recebidoPor: text('recebido_por').notNull(),
  recebidoEm: timestamp('recebido_em', { withTimezone: true }).notNull().defaultNow(),
  observacao: text('observacao'),
});

export const historicoOrcamento = pgTable('historico_orcamento', {
  id: text('id').primaryKey(),
  orcamentoId: text('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(), // 'item_removido'
  descricao: text('descricao').notNull(),
  justificativa: text('justificativa').notNull(),
  autor: text('autor').notNull(),
  registradoEm: timestamp('registrado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const notificacoes = pgTable('notificacoes', {
  id: text('id').primaryKey(),
  perfilDestino: text('perfil_destino').notNull(), // 'Engenheiro' | 'Comprador'
  usuarioDestino: text('usuario_destino'),
  mensagem: text('mensagem').notNull(),
  orcamentoId: text('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  lida: boolean('lida').notNull().default(false),
});

export const orcamentosRelations = relations(orcamentos, ({ many, one }) => ({
  versoes: many(versoesOrcamento),
  cotacoesImportadas: many(cotacoesImportadas),
  recebimentos: many(recebimentos),
  historico: many(historicoOrcamento),
  obra: one(obras, { fields: [orcamentos.obraId], references: [obras.id] }),
}));

export const versoesOrcamentoRelations = relations(versoesOrcamento, ({ one }) => ({
  orcamento: one(orcamentos, { fields: [versoesOrcamento.orcamentoId], references: [orcamentos.id] }),
}));

export const cotacoesImportadasRelations = relations(cotacoesImportadas, ({ one }) => ({
  orcamento: one(orcamentos, { fields: [cotacoesImportadas.orcamentoId], references: [orcamentos.id] }),
}));

export const recebimentosRelations = relations(recebimentos, ({ one }) => ({
  orcamento: one(orcamentos, { fields: [recebimentos.orcamentoId], references: [orcamentos.id] }),
}));

export const historicoOrcamentoRelations = relations(historicoOrcamento, ({ one }) => ({
  orcamento: one(orcamentos, { fields: [historicoOrcamento.orcamentoId], references: [orcamentos.id] }),
}));

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  usuariosObras: many(usuariosObras),
}));

export const usuariosObrasRelations = relations(usuariosObras, ({ one }) => ({
  usuario: one(usuarios, { fields: [usuariosObras.usuarioId], references: [usuarios.id] }),
  obra: one(obras, { fields: [usuariosObras.obraId], references: [obras.id] }),
}));

/**
 * Contador dos códigos "OR-0001"/"COT-0001" — uma linha só, incrementada
 * com `UPDATE ... RETURNING` (atômico, sem depender de sequence do
 * Postgres nem de um builder próprio no Drizzle pra isso).
 */
export const contadores = pgTable('contadores', {
  id: integer('id').primaryKey().default(1),
  orcamentoProximo: integer('orcamento_proximo').notNull().default(1),
  cotacaoProximo: integer('cotacao_proximo').notNull().default(1),
});
