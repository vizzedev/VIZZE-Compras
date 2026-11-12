/**
 * DMC:    VIZ-00-00-00-600C
 * Título: Núcleo › Aplica as migrações no banco
 * BREX:   VIZ-00-00-00-022A
 *
 * Roda uma vez (no deploy, ou manualmente): aplica os arquivos SQL
 * gerados por `npm run db:generate` em `server/db/migrations/`.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada.');
}

const client = postgres(DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

await migrate(db, { migrationsFolder: './server/db/migrations' });
console.log('[migrate] migrações aplicadas.');
await client.end();
