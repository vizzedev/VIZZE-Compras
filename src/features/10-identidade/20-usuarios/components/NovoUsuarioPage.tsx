/**
 * DMC:    VIZ-10-20-00-400B
 * Título: Identidade e acesso › Novo usuário (Master)
 * BREX:   VIZ-00-00-00-022A
 *
 * Encarregado precisa de pelo menos uma obra atrelada — é o que
 * decide o que ele enxerga depois de logado (ver `obrasPermitidas` em
 * auth.ts). Por isso o perfil vira estado controlado: só assim dá pra
 * mostrar/validar a lista de obras condicionalmente.
 */
import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, input, label, btnPrimary, btnSecondary } from '@/components/ui/styles';
import { obrasStore, usuariosStore, type Usuario } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { useSessao } from '@/lib/auth';

export function NovoUsuarioPage() {
  const navigate = useNavigate();
  const sessao = useSessao();
  const obras = useLista(obrasStore);
  const [erro, setErro] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Usuario['perfil']>('Engenheiro');
  const [obrasSelecionadas, setObrasSelecionadas] = useState<ReadonlySet<string>>(new Set());

  if (sessao && sessao.perfil !== 'Master') return <Navigate to="/obras" replace />;

  const nomeRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  function alternarObra(obraId: string) {
    setObrasSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(obraId)) novo.delete(obraId);
      else novo.add(obraId);
      return novo;
    });
    setErro(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nome = nomeRef.current?.value.trim() ?? '';
    const senha = senhaRef.current?.value ?? '';
    if (!nome || !senha) {
      setErro('Preencha nome e senha inicial.');
      return;
    }
    if (perfil === 'Encarregado' && obrasSelecionadas.size === 0) {
      setErro('Escolha pelo menos uma obra para o encarregado.');
      return;
    }
    usuariosStore.adicionar({
      nome,
      senha,
      perfil,
      obrasIds: perfil === 'Encarregado' ? [...obrasSelecionadas] : [],
    });
    navigate('/usuarios');
  }

  return (
    <AppShell backTo="/usuarios" backLabel="Usuários" title="Novo usuário">
      <form onSubmit={handleSubmit} className={`${card} flex max-w-[480px] flex-col gap-3.5`}>
        <div>
          <label className={label} htmlFor="nome">Nome</label>
          <input id="nome" ref={nomeRef} className={input} onChange={() => setErro(null)} />
        </div>
        <div>
          <label className={label} htmlFor="senha">Senha inicial</label>
          <input id="senha" ref={senhaRef} type="password" className={input} onChange={() => setErro(null)} />
        </div>
        <div>
          <label className={label} htmlFor="perfil">Perfil</label>
          <select
            id="perfil"
            className={input}
            value={perfil}
            onChange={(e) => {
              setPerfil(e.target.value as Usuario['perfil']);
              setErro(null);
            }}
          >
            <option>Engenheiro</option>
            <option>Comprador</option>
            <option>Encarregado</option>
          </select>
        </div>

        {perfil === 'Encarregado' && (
          <div>
            <label className={label}>Obras (obrigatório pelo menos uma)</label>
            {obras.length === 0 ? (
              <p className="m-0 text-xs text-texto-suave">Nenhuma obra cadastrada ainda.</p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-xl border border-borda p-2.5">
                {obras.map((obra) => (
                  <label key={obra.id} className="flex items-center gap-2 text-sm text-texto">
                    <input
                      type="checkbox"
                      checked={obrasSelecionadas.has(obra.id)}
                      onChange={() => alternarObra(obra.id)}
                    />
                    {obra.nome}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {erro && <p className="m-0 text-xs text-erro">{erro}</p>}
        <p className="m-0 text-xs text-texto-suave">O usuário pode trocar a senha depois do primeiro acesso.</p>

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={() => navigate('/usuarios')} className={btnSecondary}>Cancelar</button>
          <button type="submit" className={btnPrimary}>Criar usuário</button>
        </div>
      </form>
    </AppShell>
  );
}
