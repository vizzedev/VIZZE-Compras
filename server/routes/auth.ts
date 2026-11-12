/**
 * DMC:    VIZ-10-00-00-500B
 * Título: Identidade e acesso › API › Login, logout e sessão atual
 * BREX:   VIZ-00-00-00-022A
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { usuarios, usuariosObras } from '../db/schema';
import { conferirSenha, emitirCookieSessao, lerSessao, limparCookieSessao, type Sessao } from '../auth';

export const rotaAuth = Router();

rotaAuth.post('/login', async (req, res) => {
  const { usuario, senha } = req.body as { usuario: string; senha: string };
  const [encontrado] = await db.select().from(usuarios).where(eq(usuarios.nome, (usuario ?? '').trim()));
  if (!encontrado || !(await conferirSenha(senha ?? '', encontrado.senhaHash))) {
    res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
    return;
  }
  const vinculos = await db.select().from(usuariosObras).where(eq(usuariosObras.usuarioId, encontrado.id));
  const sessao: Sessao = {
    usuarioId: encontrado.id,
    nome: encontrado.nome,
    perfil: encontrado.perfil as Sessao['perfil'],
    obrasIds: vinculos.map((v) => v.obraId),
  };
  emitirCookieSessao(res, sessao);
  res.json(sessao);
});

rotaAuth.post('/logout', (_req, res) => {
  limparCookieSessao(res);
  res.json({ ok: true });
});

rotaAuth.get('/sessao', (req, res) => {
  res.json(lerSessao(req));
});
