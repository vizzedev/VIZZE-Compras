/**
 * DMC:    VIZ-10-00-00-400A
 * Título: Identidade e acesso › Login › Tela
 * BREX:   VIZ-00-00-00-022A
 *
 * Usuário/senha são checados de verdade no servidor (bcrypt) — ver
 * src/lib/auth.ts e server/routes/auth.ts.
 *
 * Pós-login é um `window.location.href` (recarga completa), não
 * `navigate` do router: as stores em `src/lib/store.ts` buscam os
 * dados do servidor uma única vez, no carregamento do módulo — se o
 * login só trocasse de rota no React, esses módulos já teriam rodado
 * (e levado 401, por rodar antes do cookie existir) e nunca mais
 * buscariam de novo, deixando toda tela vazia mesmo com sessão válida.
 */
import { useRef, useState } from 'react';
import { authStore } from '@/lib/auth';

export function LoginPage() {
  const usuarioRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const sessao = await authStore.entrar(usuarioRef.current?.value ?? '', senhaRef.current?.value ?? '');
    if (!sessao) {
      setErro('Usuário ou senha incorretos.');
      return;
    }
    window.location.href = sessao.perfil === 'Master' ? '/usuarios' : '/obras';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fundo">
      <form
        onSubmit={handleSubmit}
        className="w-[360px] rounded-card bg-superficie p-8 shadow-card"
      >
        <p className="mb-1 text-sm font-bold text-primaria">Vizze Compras</p>
        <h1 className="mb-5 mt-0 text-xl font-bold text-texto">Entrar</h1>

        <label className="mb-1 block text-xs text-texto-suave" htmlFor="usuario">
          Usuário
        </label>
        <input
          id="usuario"
          ref={usuarioRef}
          className="mb-3.5 w-full rounded-xl border border-borda px-2.5 py-2 text-sm"
          onChange={() => setErro(null)}
        />

        <label className="mb-1 block text-xs text-texto-suave" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          ref={senhaRef}
          type="password"
          className="mb-5 w-full rounded-xl border border-borda px-2.5 py-2 text-sm"
          onChange={() => setErro(null)}
        />
        {erro && <p className="-mt-3 mb-3 text-xs text-erro">{erro}</p>}

        <button
          type="submit"
          className="w-full rounded-full bg-primaria py-2.5 text-sm font-medium text-white shadow-card"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
