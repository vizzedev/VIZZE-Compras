/**
 * DMC:    VIZ-10-00-00-500A
 * Título: Identidade e acesso › Sessão no servidor (bcrypt + cookie assinado)
 * BREX:   VIZ-00-00-00-022A
 *
 * Senha nunca mais em texto puro (bcrypt, 10 rounds). Sessão é um JWT
 * num cookie `httpOnly` (o navegador nunca lê o valor por JS — mitiga
 * XSS) + `sameSite: 'lax'` (mitiga CSRF sem precisar de token à parte,
 * suficiente porque este app não embute formulários de terceiros) +
 * `secure` em produção (exige HTTPS; ver docs/decisoes.md sobre o
 * domínio sslip.io sem certificado — outro motivo pra esse domínio ser
 * trocado por um com HTTPS de verdade antes de dados reais da empresa).
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET não configurada — defina no .env.local (dev) ou nas variáveis de ambiente do servidor (produção).');
}

const COOKIE = 'vizze_sessao';
const DURACAO_DIAS = 7;

export interface Sessao {
  readonly usuarioId: string;
  readonly nome: string;
  readonly perfil: 'Master' | 'Engenheiro' | 'Comprador' | 'Encarregado';
  readonly obrasIds: readonly string[];
}

export async function gerarHash(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function emitirCookieSessao(res: Response, sessao: Sessao): void {
  const token = jwt.sign(sessao, SESSION_SECRET!, { expiresIn: `${DURACAO_DIAS}d` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACAO_DIAS * 24 * 60 * 60 * 1000,
  });
}

export function limparCookieSessao(res: Response): void {
  res.clearCookie(COOKIE);
}

export function lerSessao(req: Request): Sessao | null {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, SESSION_SECRET!) as Sessao;
  } catch {
    return null;
  }
}

/** Middleware: bloqueia sem sessão válida. Perfil específico é checado na própria rota (regra de negócio, não de autenticação). */
export function exigirSessao(req: Request, res: Response, next: NextFunction): void {
  const sessao = lerSessao(req);
  if (!sessao) {
    res.status(401).json({ erro: 'Sessão inválida ou expirada — faça login de novo.' });
    return;
  }
  (req as Request & { sessao: Sessao }).sessao = sessao;
  next();
}
