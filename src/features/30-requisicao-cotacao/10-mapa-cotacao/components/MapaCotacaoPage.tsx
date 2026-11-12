/**
 * DMC:    VIZ-30-10-00-400A
 * Título: Requisição e cotação › Mapa de cotação
 * BREX:   VIZ-00-00-00-022A
 *
 * Recebe as respostas dos fornecedores (PDFs enviados por fora do
 * sistema) como importações, escopadas a este orçamento (`:orcamentoId`)
 * — cada uma identifica o fornecedor na hora, ver ImportarCotacaoPage.
 * O comparativo só fica disponível depois de pelo menos uma importação.
 */
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { EtapasPipeline } from '@/components/ui/EtapasPipeline';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { card, btnPrimary, btnSoft, pill, formatMoeda } from '@/components/ui/styles';
import { avancarEtapa, cotacoesImportadasStore, orcamentosStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';

export function MapaCotacaoPage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;
  const todasCotacoes = useLista(cotacoesImportadasStore);
  const cotacoes = todasCotacoes.filter((c) => c.orcamentoId === orcamentoId);

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento) {
    return <Navigate to="/obras" replace />;
  }

  function verComparativo() {
    orcamentosStore.atualizar(orcamento!.id, { etapa: avancarEtapa(orcamento!.etapa, 'comparativo') });
    navigate(`/comparativo/${orcamento!.id}`);
  }

  return (
    <AppShell active="obras" backTo={`/requisicao/${orcamento.id}`} backLabel="Requisição" title={`Mapa de cotação — Orçamento ${orcamento.codigo}`}>
      <EtapasPipeline orcamentoId={orcamento.id} etapaAlcancada={orcamento.etapa} atual="cotacao" />
      <p className="-mt-3 text-xs text-texto-suave">Importe as respostas recebidas de cada fornecedor.</p>

      <div className={`${card} flex flex-col gap-3`}>
        {cotacoes.length === 0 ? (
          <p className="m-0 text-sm text-texto-suave">Nenhuma cotação importada ainda.</p>
        ) : (
          cotacoes.map((cotacao) => {
            const total = cotacao.itens.reduce((soma, item) => soma + item.subtotal, 0) + cotacao.frete;
            return (
              <div key={cotacao.id} className="flex items-center justify-between border-b border-borda pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-bold text-texto">{cotacao.fornecedorNome}</div>
                  <div className="text-xs text-texto-suave">{cotacao.arquivo} · {cotacao.itens.length} itens · {formatMoeda(total)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={pill('primaria')}>importada</span>
                  <Link to={`/mapas-cotacao/${orcamento.id}/${cotacao.id}/editar`} className={btnSoft}>Revisar</Link>
                  <button className="text-xs text-texto-suave" onClick={() => cotacoesImportadasStore.remover(cotacao.id)}>
                    Remover
                  </button>
                </div>
              </div>
            );
          })
        )}
        <Link
          to={`/mapas-cotacao/${orcamento.id}/importar`}
          className="rounded-card border border-dashed border-borda bg-superficie p-4 text-center text-sm text-texto-suave no-underline"
        >
          + Importar cotação
        </Link>
      </div>

      <div className="flex justify-end">
        <button className={btnPrimary} disabled={cotacoes.length === 0} onClick={verComparativo}>
          Ver comparativo
        </button>
      </div>
    </AppShell>
  );
}
