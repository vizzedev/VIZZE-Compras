/**
 * DMC:    VIZ-00-00-00-600D
 * Título: Núcleo › Seed de produção — usuário Master inicial
 * BREX:   VIZ-00-00-00-022A
 *
 * Idempotente: roda toda vez que o container sobe (ver server/index.ts)
 * e só cria o Master se ele ainda não existir — nunca sobrescreve uma
 * senha já trocada. Só isso entra em produção; o cenário de
 * demonstração (`seedDemo.ts`) é só pra ambiente de desenvolvimento.
 */
import { eq } from 'drizzle-orm';
import { db } from './client';
import { usuarios, contadores } from './schema';
import { gerarHash } from '../auth';
import { gerarId } from '../routes/id';

export async function seedProducao(): Promise<void> {
  await db.insert(contadores).values({ id: 1 }).onConflictDoNothing();

  const nome = process.env.MASTER_USUARIO;
  const senha = process.env.MASTER_SENHA;
  if (!nome || !senha) {
    console.warn('[seed] MASTER_USUARIO/MASTER_SENHA não configuradas — nenhum usuário Master criado automaticamente.');
    return;
  }
  const [existente] = await db.select().from(usuarios).where(eq(usuarios.nome, nome));
  if (existente) return;

  const senhaHash = await gerarHash(senha);
  await db.insert(usuarios).values({ id: gerarId(), nome, senhaHash, perfil: 'Master' });
  console.log(`[seed] usuário Master "${nome}" criado.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducao()
    .then(() => process.exit(0))
    .catch((erro) => { console.error(erro); process.exit(1); });
}
