/**
 * DMC:    VIZ-00-00-00-500A
 * Título: Núcleo › Servidor (API + estático) — único runtime, dev e produção
 * BREX:   VIZ-00-00-00-022A
 *
 * Antes havia dois lugares com a mesma lógica (middleware do Vite em
 * dev, `server.js` solto em produção, ver decisoes.md) — agora o
 * Express é sempre o mesmo processo; em dev o Vite só faz proxy de
 * `/api` pra cá (ver vite.config.ts), em produção ele também serve o
 * `dist/` (abaixo). `seedProducao`/`seedDemo` rodam no boot: o
 * primeiro sempre (idempotente), o segundo só fora de produção e só se
 * o banco estiver vazio.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rotaAuth } from './routes/auth';
import { rotaUsuarios } from './routes/usuarios';
import { rotaOrcamentos } from './routes/orcamentos';
import { rotaLeituraIA } from './routes/leituraIA';
import { rotaCrud } from './routes/generico';
import { obras, fornecedores, cotacoesImportadas, notificacoes } from './db/schema';
import { seedProducao } from './db/seed';
import { db } from './db/client';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTA = process.env.PORT || 3000;
const EM_PRODUCAO = process.env.NODE_ENV === 'production';

async function bootstrap() {
  await migrate(db, { migrationsFolder: path.join(__dirname, 'db', 'migrations') });
  await seedProducao();
  if (!EM_PRODUCAO) {
    const { seedDemo } = await import('./db/seedDemo');
    await seedDemo();
  }

  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(cookieParser());

  app.use('/api', rotaAuth);
  app.use('/api/usuarios', rotaUsuarios);
  app.use('/api/orcamentos', rotaOrcamentos);
  app.use('/api/ler-documento', rotaLeituraIA);
  app.use('/api/obras', rotaCrud(obras, obras.id));
  app.use('/api/fornecedores', rotaCrud(fornecedores, fornecedores.id));
  app.use('/api/cotacoes', rotaCrud(cotacoesImportadas, cotacoesImportadas.id));
  app.use('/api/notificacoes', rotaCrud(notificacoes, notificacoes.id, ['criadaEm']));

  if (EM_PRODUCAO) {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  }

  app.listen(PORTA, () => {
    console.log(`Vizze Compras rodando na porta ${PORTA} (${EM_PRODUCAO ? 'produção' : 'desenvolvimento'})`);
  });
}

bootstrap().catch((erro) => {
  console.error('Falha ao iniciar o servidor:', erro);
  process.exit(1);
});
