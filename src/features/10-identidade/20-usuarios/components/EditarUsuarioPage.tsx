/**
 * DMC:    VIZ-10-20-00-400C
 * Título: Identidade e acesso › Editar usuário (Master)
 * BREX:   VIZ-00-00-00-022A
 *
 * A senha fica em hash no banco (mão única) — nem o Master consegue
 * ver a senha atual de ninguém, só definir uma nova. Campo de senha
 * fica em branco por padrão: só muda se o Master preencher.
 */
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { card, input, label, btnPrimary, btnSecondary } from '@/components/ui/styles';
import { obrasStore, usuariosStore, type Usuario } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { useSessao } from '@/lib/auth';

export function EditarUsuarioPage() {
  const navigate = useNavigate();
  const sessao = useSessao();
  const { usuarioId } = useParams();
  const obras = useLista(obrasStore);
  useLista(usuariosStore);
  const usuario = usuarioId ? usuariosStore.obter(usuarioId) : undefined;
  const [erro, setErro] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Usuario['perfil']>(usuario?.perfil ?? 'Engenheiro');
  const [obrasSelecionadas, setObrasSelecionadas] = useState<ReadonlySet<string>>(new Set(usuario?.obrasIds ?? []));

  if (sessao && sessao.perfil !== 'Master') return <Navigate to="/obras" replace />;
  if (!usuario && usuariosStore.carregando()) return <CarregandoPagina />;
  if (!usuario) return <Navigate to="/usuarios" replace />;

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
    const novaSenha = senhaRef.current?.value ?? '';
    if (!nome) {
      setErro('O nome não pode ficar vazio.');
      return;
    }
    if (perfil === 'Encarregado' && obrasSelecionadas.size === 0) {
      setErro('Escolha pelo menos uma obra para o encarregado.');
      return;
    }
    usuariosStore.atualizar(usuario!.id, {
      nome,
      perfil,
      obrasIds: perfil === 'Encarregado' ? [...obrasSelecionadas] : [],
      ...(novaSenha ? { senha: novaSenha } : {}),
    });
    navigate('/usuarios');
  }

  return (
    <AppShell backTo="/usuarios" backLabel="Usuários" title="Editar usuário">
      <form onSubmit={handleSubmit} className={`${card} flex max-w-[480px] flex-col gap-3.5`}>
        <div>
          <label className={label} htmlFor="nome">Nome</label>
          <input id="nome" ref={nomeRef} className={input} defaultValue={usuario.nome} onChange={() => setErro(null)} />
        </div>
        <div>
          <label className={label} htmlFor="senha">Nova senha</label>
          <input id="senha" ref={senhaRef} type="password" className={input} placeholder="Deixe em branco para manter a senha atual" onChange={() => setErro(null)} />
          <p className="m-0 mt-1 text-[11px] text-texto-suave">
            A senha atual não pode ser exibida (fica só em hash no banco) — preencha aqui só se quiser redefini-la.
          </p>
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
            <option>Master</option>
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

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={() => navigate('/usuarios')} className={btnSecondary}>Cancelar</button>
          <button type="submit" className={btnPrimary}>Salvar alterações</button>
        </div>
      </form>
    </AppShell>
  );
}
