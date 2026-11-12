/**
 * DMC:    VIZ-00-00-00-500B
 * Título: Núcleo › API › CRUD genérico (obras, fornecedores, cotações, notificações)
 * BREX:   VIZ-00-00-00-022A
 *
 * As 4 tabelas que o cliente trata como "lista simples" (sem
 * sub-coleção aninhada, sem numeração especial) usam o mesmo CRUD —
 * `id` sempre vem do cliente (`gerarId()`), nunca gerado aqui.
 * `camposData` marca quais colunas são timestamp, pra virar Date antes
 * do INSERT/UPDATE (o cliente manda string ISO) e voltar a ser string
 * ISO na resposta (o Drizzle devolve `Date`, o tipo do cliente é `string`).
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../db/client';
import { exigirSessao } from '../auth';

function paraLinha(dados: Record<string, unknown>, camposData: readonly string[]): Record<string, unknown> {
  const linha = { ...dados };
  for (const campo of camposData) {
    if (typeof linha[campo] === 'string') linha[campo] = new Date(linha[campo] as string);
  }
  return linha;
}

function paraCliente(linha: Record<string, unknown>, camposData: readonly string[]): Record<string, unknown> {
  const resultado = { ...linha };
  for (const campo of camposData) {
    if (resultado[campo] instanceof Date) resultado[campo] = (resultado[campo] as Date).toISOString();
  }
  return resultado;
}

export function rotaCrud(tabela: PgTable, idColuna: PgColumn, camposData: readonly string[] = []): Router {
  const router = Router();
  router.use(exigirSessao);

  router.get('/', async (_req, res) => {
    const linhas = await db.select().from(tabela);
    res.json(linhas.map((l) => paraCliente(l as Record<string, unknown>, camposData)));
  });

  router.post('/', async (req, res) => {
    const linha = paraLinha(req.body, camposData);
    await db.insert(tabela).values(linha);
    res.status(201).json({ ok: true });
  });

  router.patch('/:id', async (req, res) => {
    const linha = paraLinha(req.body, camposData);
    await db.update(tabela).set(linha).where(eq(idColuna, req.params.id));
    res.json({ ok: true });
  });

  router.delete('/:id', async (req, res) => {
    await db.delete(tabela).where(eq(idColuna, req.params.id));
    res.json({ ok: true });
  });

  return router;
}
