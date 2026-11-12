/**
 * DMC:    VIZ-10-20-00-500A
 * Título: Identidade e acesso › API › Usuários
 * BREX:   VIZ-00-00-00-022A
 *
 * Senha nunca sai daqui — só entra (hash na criação). `obrasIds` é
 * montado a partir de `usuarios_obras` (N:N), não é coluna de
 * `usuarios`.
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { usuarios, usuariosObras } from '../db/schema';
import { exigirSessao, gerarHash } from '../auth';

export const rotaUsuarios = Router();
rotaUsuarios.use(exigirSessao);

rotaUsuarios.get('/', async (_req, res) => {
  const linhas = await db.select().from(usuarios);
  const vinculos = await db.select().from(usuariosObras);
  res.json(linhas.map((u) => ({
    id: u.id,
    nome: u.nome,
    perfil: u.perfil,
    obrasIds: vinculos.filter((v) => v.usuarioId === u.id).map((v) => v.obraId),
  })));
});

rotaUsuarios.post('/', async (req, res) => {
  const { id, nome, senha, perfil, obrasIds } = req.body as {
    id: string; nome: string; senha: string; perfil: string; obrasIds: readonly string[];
  };
  if (!id || !nome || !senha || !perfil) {
    res.status(400).json({ erro: 'Id, nome, senha e perfil são obrigatórios.' });
    return;
  }
  const senhaHash = await gerarHash(senha);
  await db.insert(usuarios).values({ id, nome, senhaHash, perfil });
  if (obrasIds && obrasIds.length > 0) {
    await db.insert(usuariosObras).values(obrasIds.map((obraId) => ({ usuarioId: id, obraId })));
  }
  res.status(201).json({ ok: true });
});

rotaUsuarios.delete('/:id', async (req, res) => {
  await db.delete(usuarios).where(eq(usuarios.id, req.params.id));
  res.json({ ok: true });
});
