/**
 * DMC:    VIZ-20-00-00-400A
 * Título: Cadastros base › Obras › Lista e cadastro
 * BREX:   VIZ-00-00-00-022A
 *
 * "Nova requisição" já cria o orçamento (com a obra pré-preenchida) e
 * manda para a requisição — ele passa a contar na listagem desde esse
 * clique, não só quando o comparativo for montado. Encarregado só vê
 * "Nova requisição" — cadastrar/editar/excluir obra não é da conta
 * dele (só cria requisição e dá recebimento de material). Também só
 * enxerga as obras em que foi cadastrado (`obrasPermitidas`) — nunca
 * o resto do parque de obras.
 */
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { btnSoft } from '@/components/ui/styles';
import { criarOrcamento, obrasStore, type Obra } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { obrasPermitidas, useSessao } from '@/lib/auth';

export function ObrasPage() {
  const navigate = useNavigate();
  const sessao = useSessao();
  const obras = obrasPermitidas(sessao, useLista(obrasStore));
  const encarregado = sessao?.perfil === 'Encarregado';

  async function novaRequisicao(obra: Obra) {
    const orcamento = await criarOrcamento(sessao?.nome ?? 'Comprador', obra);
    navigate(`/requisicao/${orcamento.id}`);
  }

  return (
    <AppShell active="obras" title="Obras">
      <div className="flex flex-col gap-3">
        {obras.map((obra) => (
          <div
            key={obra.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-superficie p-4 shadow-card"
          >
            <div>
              <div className="text-sm font-bold text-texto">{obra.nome}</div>
              <div className="text-xs text-texto-suave">Cliente: {obra.cliente}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => novaRequisicao(obra)} className={btnSoft}>
                Nova requisição
              </button>
              {!encarregado && (
                <>
                  <Link to={`/obras/${obra.id}/editar`} className={btnSoft}>
                    Editar
                  </Link>
                  <button className="text-xs text-texto-suave" onClick={() => obrasStore.remover(obra.id)}>
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {!encarregado && (
          <Link
            to="/obras/nova"
            className="rounded-card border border-dashed border-borda bg-superficie p-4 text-center text-sm text-texto-suave no-underline"
          >
            + Cadastrar nova obra
          </Link>
        )}
      </div>

      <p className="-mt-1 text-xs text-texto-suave">
        {encarregado
          ? 'Encarregado só pode criar requisição aqui e dar recebimento de material nos orçamentos aprovados.'
          : 'Qualquer perfil pode cadastrar uma obra. Excluir é exclusivo de Engenheiro ou Master.'}
      </p>
    </AppShell>
  );
}
