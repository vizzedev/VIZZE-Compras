/**
 * DMC:    VIZ-30-30-00-400A
 * Título: Requisição e cotação › Comparativo de preços
 * BREX:   VIZ-00-00-00-022A
 *
 * O comprador pode trocar manualmente o fornecedor escolhido por item
 * (coluna "Escolha"), em vez de aceitar sempre o mais barato sugerido
 * — pedido do usuário. Lê a obra direto do orçamento (`:orcamentoId`),
 * já preenchida desde a requisição. "Montar orçamento" só roda uma
 * vez — depois disso, os ajustes finais (fornecedor, frete) são feitos
 * na própria tela do orçamento, que já tem esse editor.
 */
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { EtapasPipeline } from '@/components/ui/EtapasPipeline';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { card, input, btnPrimary, btnSoft, formatMoeda } from '@/components/ui/styles';
import { agora, avancarEtapa, cotacoesImportadasStore, orcamentosStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { montarComparativo, totalComEscolhas, totalPorFornecedor } from '../logic';

export function ComparativoPage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;
  const todasCotacoes = useLista(cotacoesImportadasStore);
  const cotacoes = todasCotacoes.filter((c) => c.orcamentoId === orcamentoId);
  const linhas = montarComparativo(cotacoes);
  const totais = totalPorFornecedor(cotacoes);
  const fornecedores = cotacoes.map((c) => c.fornecedorNome);
  const [escolhas, setEscolhas] = useState<ReadonlyMap<string, string>>(new Map());

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento) {
    return <Navigate to="/obras" replace />;
  }

  function escolherFornecedor(item: string, fornecedor: string) {
    setEscolhas((atual) => {
      const novo = new Map(atual);
      novo.set(item, fornecedor);
      return novo;
    });
  }

  function montarOrcamento() {
    const frete = cotacoes.reduce((soma, c) => soma + c.frete, 0);
    orcamentosStore.atualizar(orcamento!.id, {
      mapaMontadoEm: agora(),
      etapa: avancarEtapa(orcamento!.etapa, 'rascunho'),
      versoes: [
        {
          versao: 1,
          status: 'rascunho',
          criadaEm: agora(),
          frete,
          totaisPorFornecedor: Object.fromEntries(totais),
          itens: linhas.map((linha) => ({
            item: linha.item,
            porFornecedor: Object.fromEntries(linha.porFornecedor),
            fornecedorEscolhido: escolhas.get(linha.item) ?? linha.fornecedorSugerido,
          })),
        },
      ],
    });
    navigate(`/orcamento/${orcamento!.id}`);
  }

  const jaMontado = orcamento.versoes.length > 0;

  if (cotacoes.length === 0) {
    return (
      <AppShell active="obras" backTo={`/mapas-cotacao/${orcamento.id}`} backLabel="Mapa de cotação" title="Comparativo de preços">
        <EtapasPipeline orcamentoId={orcamento.id} etapaAlcancada={orcamento.etapa} atual="comparativo" />
        <div className={card}>
          <p className="m-0 mb-3 text-sm text-texto-suave">Nenhuma cotação importada ainda — importe pelo menos uma no mapa de cotação.</p>
          <Link to={`/mapas-cotacao/${orcamento.id}/importar`} className={btnSoft}>Importar cotação</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="obras" backTo={`/mapas-cotacao/${orcamento.id}`} backLabel="Mapa de cotação" title={`Comparativo de preços — Orçamento ${orcamento.codigo}`}>
      <EtapasPipeline orcamentoId={orcamento.id} etapaAlcancada={orcamento.etapa} atual="comparativo" />
      <div className="flex flex-wrap gap-5">
        <div className={`${card} flex-[3]`} style={{ minWidth: 420 }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-xs text-texto-suave">
                <th className="pb-2 text-left font-normal">Item</th>
                {fornecedores.map((nome) => (
                  <th key={nome} className="pb-2 text-left font-normal">{nome}</th>
                ))}
                <th className="pb-2 text-left font-normal">Escolha</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const escolhido = escolhas.get(linha.item) ?? linha.fornecedorSugerido;
                return (
                  <tr key={linha.item}>
                    <td className="py-1.5 pr-2 text-texto">{linha.item}</td>
                    {fornecedores.map((nome) => {
                      const valor = linha.porFornecedor.get(nome);
                      const sugerido = nome === linha.fornecedorSugerido;
                      return (
                        <td key={nome} className="py-1.5 pr-2">
                          <div className={sugerido ? 'rounded-xl bg-primaria-fundo px-3 py-2' : 'rounded-xl border border-borda px-3 py-2'}>
                            {valor !== undefined ? formatMoeda(valor) : '—'}
                            {sugerido && <div className="text-xs text-primaria">sugerido</div>}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1.5 pr-2">
                      <select className={input} value={escolhido} onChange={(e) => escolherFornecedor(linha.item, e.target.value)}>
                        {Array.from(linha.porFornecedor.keys()).map((nome) => (
                          <option key={nome} value={nome}>{nome}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              <tr className="text-texto-suave">
                <td className="py-1.5 text-xs">Frete</td>
                {cotacoes.map((c) => (
                  <td key={c.id} className="py-1.5 text-xs">{formatMoeda(c.frete)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-1 flex-col gap-3" style={{ minWidth: 220 }}>
          {Array.from(totais.entries()).map(([nome, total]) => (
            <div key={nome} className={card}>
              <div className="text-xs text-texto-suave">Total {nome}</div>
              <div className="text-base font-bold text-texto">{formatMoeda(total)}</div>
            </div>
          ))}
          <div className="rounded-card bg-primaria-fundo p-4">
            <div className="text-xs text-primaria">Total selecionado (itens mesclados)</div>
            <div className="text-xl font-bold text-primaria">{formatMoeda(totalComEscolhas(linhas, escolhas))}</div>
          </div>
          {jaMontado ? (
            <div className={card}>
              <p className="m-0 mb-3 text-xs text-texto-suave">Orçamento já montado — ajuste fornecedor e frete na tela do orçamento.</p>
              <Link to={`/orcamento/${orcamento.id}`} className={`${btnPrimary} block text-center`}>
                Ir para o orçamento
              </Link>
            </div>
          ) : (
            <button className={btnPrimary} onClick={montarOrcamento}>
              Montar orçamento com estas escolhas
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
