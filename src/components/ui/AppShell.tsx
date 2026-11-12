/**
 * DMC:    VIZ-00-00-00-400B
 * Título: Núcleo › Menu de navegação persistente + voltar + notificações
 * BREX:   VIZ-00-00-00-022A
 *
 * Usado por toda tela logada. `active` destaca o item do menu atual;
 * `backTo`/`backLabel` mostram o link de voltar, quando a tela tem um
 * "pai" natural na navegação (ex.: Editar obra volta para Obras). Os
 * links "Usuários" e "Painel" só aparecem para Master; "Fornecedores"
 * não aparece para Encarregado — esse perfil só cria requisição e dá
 * recebimento de material, não administra cadastro de fornecedor. O
 * sino mostra as notificações do perfil logado (engenheiro vê
 * "aguardando aprovação"; comprador vê as reprovações do que ele
 * mesmo montou) — clicar marca como lida e abre o orçamento.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authStore, useSessao } from '@/lib/auth';
import { btnPrimary } from '@/components/ui/styles';
import { criarOrcamento, notificacoesStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import logoIcone from '@/assets/logo-vizze-icone.png';

type NavItem = 'obras' | 'fornecedores' | 'orcamentos' | 'usuarios' | 'painel';

interface AppShellProps {
  active?: NavItem;
  backTo?: string;
  backLabel?: string;
  title: string;
  children: React.ReactNode;
}

const NAV_LINKS: { key: NavItem; label: string; to: string }[] = [
  { key: 'obras', label: 'Obras', to: '/obras' },
  { key: 'fornecedores', label: 'Fornecedores', to: '/fornecedores' },
  { key: 'orcamentos', label: 'Orçamentos', to: '/orcamentos' },
];

export function AppShell({ active, backTo, backLabel, title, children }: AppShellProps) {
  const sessao = useSessao();
  const navigate = useNavigate();
  const notificacoes = useLista(notificacoesStore);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const links = sessao?.perfil === 'Master'
    ? [...NAV_LINKS, { key: 'usuarios' as const, label: 'Usuários', to: '/usuarios' }, { key: 'painel' as const, label: 'Painel', to: '/painel' }]
    : sessao?.perfil === 'Encarregado'
      ? NAV_LINKS.filter((item) => item.key !== 'fornecedores')
      : NAV_LINKS;

  const minhasNotificacoes = sessao
    ? notificacoes
        .filter((n) => n.perfilDestino === sessao.perfil && (!n.usuarioDestino || n.usuarioDestino === sessao.nome))
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    : [];
  const naoLidas = minhasNotificacoes.filter((n) => !n.lida).length;

  async function sair() {
    await authStore.sair();
    // recarga completa (não `navigate`): zera as stores em memória, senão o
    // próximo login nesta mesma aba reaproveitaria dados do usuário anterior
    // (mesma causa raiz do bug corrigido em LoginPage.tsx)
    window.location.href = '/login';
  }

  function abrirNotificacao(id: string, orcamentoId: string) {
    notificacoesStore.atualizar(id, { lida: true });
    setNotificacoesAbertas(false);
    navigate(`/orcamento/${orcamentoId}`);
  }

  async function novoOrcamento() {
    const orcamento = await criarOrcamento(sessao?.nome ?? 'Comprador');
    navigate(`/requisicao/${orcamento.id}`);
  }

  return (
    <div className="min-h-screen bg-fundo print:bg-white">
      <header className="flex items-center justify-between bg-superficie px-8 py-4 shadow-card print:hidden">
        <div className="flex items-center gap-7">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/85 p-2 backdrop-blur-md"
            aria-label="Vizze Compras"
          >
            <img src={logoIcone} alt="" className="h-full w-full object-contain" />
          </span>
          {links.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={
                'rounded-full px-4 py-1.5 text-sm no-underline ' +
                (active === item.key
                  ? 'border border-black/10 bg-black/5 font-bold text-texto backdrop-blur-md'
                  : 'text-texto-suave')
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={novoOrcamento} className={btnPrimary}>
            + Novo orçamento
          </button>

          {sessao && (
            <div className="relative">
              <button
                onClick={() => setNotificacoesAbertas((aberto) => !aberto)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-sm backdrop-blur-md"
                aria-label="Notificações"
              >
                🔔
                {naoLidas > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold text-white">
                    {naoLidas}
                  </span>
                )}
              </button>
              {notificacoesAbertas && (
                <div className="absolute right-0 top-11 z-10 w-80 overflow-hidden rounded-card bg-superficie shadow-card">
                  {minhasNotificacoes.length === 0 ? (
                    <p className="m-0 p-4 text-xs text-texto-suave">Nenhuma notificação por aqui.</p>
                  ) : (
                    <div className="flex max-h-80 flex-col overflow-y-auto">
                      {minhasNotificacoes.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => abrirNotificacao(n.id, n.orcamentoId)}
                          className={`border-b border-borda p-3 text-left text-xs last:border-0 ${n.lida ? 'text-texto-suave' : 'bg-primaria-fundo font-medium text-texto'}`}
                        >
                          {n.mensagem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <span className="text-sm text-texto-suave">
            {sessao ? `${sessao.nome} · ${sessao.perfil}` : 'Visitante'}
          </span>
          {sessao && (
            <button
              onClick={sair}
              className="rounded-full border border-black/10 bg-black/5 px-3.5 py-1.5 text-xs font-medium text-texto backdrop-blur-md"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-5 p-8 print:p-0">
        {backTo && (
          <Link to={backTo} className="text-xs text-texto-suave no-underline print:hidden">
            &lt; {backLabel ?? 'Voltar'}
          </Link>
        )}
        <h1 className="m-0 text-2xl font-bold text-texto print:hidden">{title}</h1>
        {children}
      </main>
    </div>
  );
}
