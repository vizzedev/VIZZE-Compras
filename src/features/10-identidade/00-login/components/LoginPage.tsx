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
 *
 * Direção visual só desta tela (fundo escuro + logo), aprovada em
 * conversa — ver docs/decisoes.md. O resto do app continua claro.
 */
import { useRef, useState } from 'react';
import { authStore } from '@/lib/auth';
import logoVizze from '@/assets/logo-vizze-branca.png';

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
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{
        background:
          'radial-gradient(rgba(255,255,255,.08) 1.2px, transparent 1.2px) 0 0/22px 22px,' +
          'radial-gradient(900px 500px at 50% -15%, rgba(255,90,53,.08), transparent 60%),' +
          'linear-gradient(160deg,#3a3a3a 0%,#333333 45%,#2a2a2a 100%)',
      }}
    >
      <div className="w-[360px]">
        <img src={logoVizze} alt="Vizze Arquitetura e Construção" className="mx-auto mb-6 block w-full max-w-[230px]" />

        <form
          onSubmit={handleSubmit}
          className="rounded-card p-8"
          style={{ background: '#3d3d3d', border: '1px solid #505050' }}
        >
          <h1 className="mb-1 mt-0 text-xl font-bold text-white">Entrar</h1>
          <p className="mb-6 text-sm" style={{ color: '#b3b3b3' }}>
            Acesse o painel de compras da sua obra.
          </p>

          <label className="mb-1.5 block text-xs" style={{ color: '#b3b3b3' }} htmlFor="usuario">
            Usuário
          </label>
          <input
            id="usuario"
            ref={usuarioRef}
            className="mb-4 w-full rounded-xl border px-3 py-2.5 text-sm text-white"
            style={{ background: '#333', borderColor: '#505050' }}
            onChange={() => setErro(null)}
          />

          <label className="mb-1.5 block text-xs" style={{ color: '#b3b3b3' }} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            ref={senhaRef}
            type="password"
            className="mb-5 w-full rounded-xl border px-3 py-2.5 text-sm text-white"
            style={{ background: '#333', borderColor: '#505050' }}
            onChange={() => setErro(null)}
          />
          {erro && <p className="-mt-3 mb-3 text-xs text-erro">{erro}</p>}

          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-full py-3 text-sm font-semibold text-[#1a1a1a] shadow-card"
            style={{ background: '#fff' }}
          >
            <span
              className="pointer-events-none absolute inset-0 -left-[60%] w-2/5 -skew-x-[20deg] transition-[left] duration-500 group-hover:left-[130%]"
              style={{ background: 'linear-gradient(115deg,transparent,rgba(0,0,0,.12),transparent)' }}
            />
            <span
              className="pointer-events-none absolute inset-x-[14%] bottom-0 h-0.5"
              style={{ background: 'linear-gradient(90deg,transparent,#ff5a35,transparent)' }}
            />
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
