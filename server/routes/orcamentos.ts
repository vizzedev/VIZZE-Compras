/**
 * DMC:    VIZ-40-00-00-500A
 * Título: Orçamento › API › CRUD aninhado (versões, recebimentos, histórico)
 * BREX:   VIZ-00-00-00-022A
 *
 * `versoes`/`recebimentos`/`historico` chegam no PATCH como o ARRAY
 * INTEIRO (igual já era com `orcamentosStore.atualizar`, em
 * `src/lib/mockData.ts`) — nunca um item isolado. Por isso persistir é
 * sempre "apaga tudo daquele orçamento e reinsere o array mandado":
 * simples e correto, porque o cliente sempre manda o estado completo
 * (anterior + o que mudou), nunca um incremento. Volume baixo (poucas
 * versões/recebimentos por orçamento), então o custo do "apaga tudo"
 * não importa.
 *
 * `codigo`/`codigoCotacao` são os dois únicos valores que precisam de
 * unicidade global de verdade (aparecem no PDF do cliente) — por isso
 * são a única coisa aqui que não é "local-first": o cliente espera a
 * resposta do servidor antes de navegar (ver `criarOrcamento` e
 * `enviarParaFornecedores`, no cliente).
 */
import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { orcamentos, versoesOrcamento, recebimentos, historicoOrcamento, contadores } from '../db/schema';
import { exigirSessao } from '../auth';
import { gerarId } from './id';

export const rotaOrcamentos = Router();
rotaOrcamentos.use(exigirSessao);

function iso(data: Date | string | null | undefined): string | undefined {
  if (!data) return undefined;
  return data instanceof Date ? data.toISOString() : data;
}

function paraVersaoCliente(v: typeof versoesOrcamento.$inferSelect) {
  return {
    versao: v.versao,
    status: v.status,
    itens: v.itens,
    totaisPorFornecedor: v.totaisPorFornecedor,
    frete: Number(v.frete),
    criadaEm: iso(v.criadaEm)!,
    enviadaParaAprovacaoEm: iso(v.enviadaParaAprovacaoEm),
    decididaEm: iso(v.decididaEm),
    aprovadoPor: v.aprovadoPor ?? undefined,
    justificativa: v.justificativa ?? undefined,
    editadoPor: v.editadoPor ?? undefined,
    notaEdicao: v.notaEdicao ?? undefined,
  };
}

function paraRecebimentoCliente(r: typeof recebimentos.$inferSelect) {
  return {
    id: r.id,
    tipo: r.tipo,
    itensRecebidos: r.itensRecebidos,
    fotoNotaFiscal: r.fotoNotaFiscal,
    recebidoPor: r.recebidoPor,
    recebidoEm: iso(r.recebidoEm)!,
    observacao: r.observacao ?? undefined,
  };
}

function paraHistoricoCliente(h: typeof historicoOrcamento.$inferSelect) {
  return {
    id: h.id,
    tipo: h.tipo,
    descricao: h.descricao,
    justificativa: h.justificativa,
    autor: h.autor,
    registradoEm: iso(h.registradoEm)!,
  };
}

async function montarTodos() {
  const [linhasOrc, linhasVer, linhasReceb, linhasHist] = await Promise.all([
    db.select().from(orcamentos),
    db.select().from(versoesOrcamento),
    db.select().from(recebimentos),
    db.select().from(historicoOrcamento),
  ]);
  return linhasOrc.map((o) => ({
    id: o.id,
    codigo: o.codigo,
    etapa: o.etapa,
    obraId: o.obraId ?? '',
    obraNome: o.obraNome,
    cliente: o.cliente,
    compradorResponsavel: o.compradorResponsavel,
    criadoEm: iso(o.criadoEm)!,
    itensRequisicao: o.itensRequisicao,
    requisicaoValidada: o.requisicaoValidada,
    codigoCotacao: o.codigoCotacao ?? undefined,
    requisicaoEnviadaEm: iso(o.requisicaoEnviadaEm),
    mapaMontadoEm: iso(o.mapaMontadoEm),
    versoes: linhasVer.filter((v) => v.orcamentoId === o.id).sort((a, b) => a.versao - b.versao).map(paraVersaoCliente),
    recebimentos: linhasReceb.filter((r) => r.orcamentoId === o.id).map(paraRecebimentoCliente),
    historico: linhasHist.filter((h) => h.orcamentoId === o.id).map(paraHistoricoCliente),
  }));
}

rotaOrcamentos.get('/', async (_req, res) => {
  res.json(await montarTodos());
});

rotaOrcamentos.post('/', async (req, res) => {
  const { compradorResponsavel, obraId, obraNome, cliente } = req.body as {
    compradorResponsavel: string; obraId?: string; obraNome?: string; cliente?: string;
  };
  const [{ codigo }] = await db
    .update(contadores)
    .set({ orcamentoProximo: sql`${contadores.orcamentoProximo} + 1` })
    .where(eq(contadores.id, 1))
    .returning({ codigo: sql<string>`'OR-' || lpad((${contadores.orcamentoProximo} - 1)::text, 4, '0')` });
  const id = gerarId();
  await db.insert(orcamentos).values({
    id, codigo, etapa: 'requisicao',
    obraId: obraId || null, obraNome: obraNome ?? '', cliente: cliente ?? '',
    compradorResponsavel, itensRequisicao: [], requisicaoValidada: false,
  });
  res.status(201).json({ id, codigo });
});

rotaOrcamentos.post('/:id/enviar-cotacao', async (req, res) => {
  const [orcamento] = await db.select().from(orcamentos).where(eq(orcamentos.id, req.params.id));
  if (!orcamento) {
    res.status(404).json({ erro: 'Orçamento não encontrado.' });
    return;
  }
  if (orcamento.codigoCotacao) {
    res.json({ codigoCotacao: orcamento.codigoCotacao });
    return;
  }
  const [{ codigoCotacao }] = await db
    .update(contadores)
    .set({ cotacaoProximo: sql`${contadores.cotacaoProximo} + 1` })
    .where(eq(contadores.id, 1))
    .returning({ codigoCotacao: sql<string>`'COT-' || lpad((${contadores.cotacaoProximo} - 1)::text, 4, '0')` });
  res.json({ codigoCotacao });
});

const CAMPOS_DATA_ORCAMENTO = ['requisicaoEnviadaEm', 'mapaMontadoEm'];

interface VersaoCorpo {
  versao: number; status: string; itens: unknown; totaisPorFornecedor: unknown; frete: number;
  criadaEm?: string; enviadaParaAprovacaoEm?: string; decididaEm?: string;
  aprovadoPor?: string; justificativa?: string; editadoPor?: string; notaEdicao?: string;
}
interface RecebimentoCorpo {
  id: string; tipo: string; itensRecebidos: unknown; fotoNotaFiscal: string; recebidoPor: string;
  recebidoEm?: string; observacao?: string;
}
interface HistoricoCorpo {
  id: string; tipo: string; descricao: string; justificativa: string; autor: string; registradoEm?: string;
}

rotaOrcamentos.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const corpo = req.body as Record<string, unknown>;
  const { versoes: versoesNovas, recebimentos: recebimentosNovos, historico: historicoNovo, ...escalares } = corpo;

  for (const campo of CAMPOS_DATA_ORCAMENTO) {
    if (typeof escalares[campo] === 'string') escalares[campo] = new Date(escalares[campo] as string);
  }
  if (Object.keys(escalares).length > 0) {
    await db.update(orcamentos).set(escalares).where(eq(orcamentos.id, id));
  }

  if (Array.isArray(versoesNovas)) {
    await db.delete(versoesOrcamento).where(eq(versoesOrcamento.orcamentoId, id));
    if (versoesNovas.length > 0) {
      await db.insert(versoesOrcamento).values((versoesNovas as VersaoCorpo[]).map((v) => ({
        id: gerarId(), orcamentoId: id, versao: v.versao, status: v.status, itens: v.itens,
        totaisPorFornecedor: v.totaisPorFornecedor, frete: String(v.frete ?? 0),
        criadaEm: v.criadaEm ? new Date(v.criadaEm) : new Date(),
        enviadaParaAprovacaoEm: v.enviadaParaAprovacaoEm ? new Date(v.enviadaParaAprovacaoEm) : null,
        decididaEm: v.decididaEm ? new Date(v.decididaEm) : null,
        aprovadoPor: v.aprovadoPor ?? null, justificativa: v.justificativa ?? null,
        editadoPor: v.editadoPor ?? null, notaEdicao: v.notaEdicao ?? null,
      })));
    }
  }

  if (Array.isArray(recebimentosNovos)) {
    await db.delete(recebimentos).where(eq(recebimentos.orcamentoId, id));
    if (recebimentosNovos.length > 0) {
      await db.insert(recebimentos).values((recebimentosNovos as RecebimentoCorpo[]).map((r) => ({
        id: r.id, orcamentoId: id, tipo: r.tipo, itensRecebidos: r.itensRecebidos,
        fotoNotaFiscal: r.fotoNotaFiscal, recebidoPor: r.recebidoPor,
        recebidoEm: r.recebidoEm ? new Date(r.recebidoEm) : new Date(),
        observacao: r.observacao ?? null,
      })));
    }
  }

  if (Array.isArray(historicoNovo)) {
    await db.delete(historicoOrcamento).where(eq(historicoOrcamento.orcamentoId, id));
    if (historicoNovo.length > 0) {
      await db.insert(historicoOrcamento).values((historicoNovo as HistoricoCorpo[]).map((h) => ({
        id: h.id, orcamentoId: id, tipo: h.tipo, descricao: h.descricao,
        justificativa: h.justificativa, autor: h.autor,
        registradoEm: h.registradoEm ? new Date(h.registradoEm) : new Date(),
      })));
    }
  }

  res.json({ ok: true });
});
