/**
 * DMC:    VIZ-00-00-00-600B
 * Título: Núcleo › Conexão com o banco (Postgres/Supabase)
 * BREX:   VIZ-00-00-00-022A
 *
 * `max: 10` porque o Supabase (ou qualquer Postgres gerenciado) limita
 * conexões simultâneas — um app pequeno não precisa de mais que isso.
 * `prepare: false` é exigido pelo Supabase Supavisor no modo
 * "transaction pooler" (porta 6543), que não suporta prepared
 * statements entre requisições.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada — defina no .env.local (dev) ou nas variáveis de ambiente do servidor (produção).');
}

const client = postgres(DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(client, { schema });
