/**
 * DMC:    VIZ-10-20-00-400A
 * Título: Identidade e acesso › Usuários (Master — lista, criar e excluir)
 * BREX:   VIZ-00-00-00-022A
 */
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, btnPrimary, pill } from '@/components/ui/styles';
import { obrasStore, usuariosStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { useSessao } from '@/lib/auth';

export function UsuariosPage() {
  const usuarios = useLista(usuariosStore);
  const obras = useLista(obrasStore);
  const sessao = useSessao();
  if (sessao && sessao.perfil !== 'Master') return <Navigate to="/obras" replace />;

  function nomesDasObras(obrasIds: readonly string[]): string {
    return obrasIds.map((id) => obras.find((o) => o.id === id)?.nome ?? '?').join(', ');
  }

  function excluir(nome: string, id: string) {
    if (!window.confirm(`Excluir o usuário "${nome}"? Essa ação não pode ser desfeita.`)) return;
    usuariosStore.remover(id);
  }

  return (
    <AppShell title="Usuários">
      <div className="-mt-3 flex justify-end">
        <Link to="/usuarios/novo" className={btnPrimary}>Novo usuário</Link>
      </div>

      <div className={`${card} flex flex-col gap-0 p-0`}>
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="flex items-center justify-between border-b border-borda p-4 last:border-0">
            <div>
              <span className="text-sm font-bold text-texto">{usuario.nome}</span>
              {usuario.perfil === 'Encarregado' && (
                <div className="text-xs text-texto-suave">
                  {usuario.obrasIds.length === 0 ? 'Sem obra atrelada ⚠️' : nomesDasObras(usuario.obrasIds)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3.5">
              <span className={pill(usuario.perfil === 'Master' ? 'primaria' : 'neutral')}>{usuario.perfil}</span>
              <Link to={`/usuarios/${usuario.id}/editar`} className="text-xs text-texto-suave">Editar</Link>
              <button className="text-xs text-texto-suave" onClick={() => excluir(usuario.nome, usuario.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-texto-suave">Este menu só aparece para o perfil Master.</p>
    </AppShell>
  );
}
