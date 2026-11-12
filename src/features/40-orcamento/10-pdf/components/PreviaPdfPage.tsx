/**
 * DMC:    VIZ-40-10-10-400A
 * Título: Orçamento › Pré-visualização do PDF após aprovação
 * BREX:   VIZ-00-00-00-022A
 *
 * O PDF que vai para o cliente traz o comparativo por fornecedor (não só
 * os itens escolhidos), para o cliente entender onde cada item foi
 * comprado e por que — pedido do usuário, ver docs/decisoes.md. Lê o
 * snapshot congelado na versão aprovada do orçamento (não recalcula do
 * mapa de cotação ao vivo), para não mudar depois de emitido. Nome do
 * arquivo ao salvar: "obra - nº orçamento - data" (pedido do usuário).
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { btnPrimary, btnSecondary, formatMoeda } from '@/components/ui/styles';
import { orcamentosStore, versaoAtual } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { dataHojePtBr, montarNomeDocumento, useTituloDocumento } from '@/lib/nomeDocumentoPdf';

export function PreviaPdfPage() {
  const { orcamentoId } = useParams();
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;

  useTituloDocumento(
    orcamento ? montarNomeDocumento(orcamento.obraNome, `Nº Orçamento ${orcamento.codigo}`) : 'Orçamento',
  );

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento) {
    return <Navigate to="/orcamentos" replace />;
  }

  const atual = versaoAtual(orcamento);
  const fornecedores = Object.keys(atual.totaisPorFornecedor);
  const subtotal = atual.itens.reduce((soma, item) => soma + (item.porFornecedor[item.fornecedorEscolhido] ?? 0), 0);
  const total = subtotal + atual.frete;

  return (
    <AppShell active="orcamentos" title="Orçamento aprovado">
      <div className="-mt-3 flex items-center gap-2 rounded-full bg-primaria-fundo px-4 py-3 text-sm text-primaria print:hidden">
        Orçamento aprovado. O PDF foi gerado — confira a pré-visualização abaixo antes de baixar.
      </div>

      <div className="mx-auto w-full max-w-[680px] rounded-card bg-superficie p-10 shadow-card print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-texto">Orçamento {orcamento.codigo} · versão {atual.versao}</div>
            <div className="mt-0.5 text-xs text-texto-suave">Emitido em {dataHojePtBr()}</div>
          </div>
          <div className="text-right text-xs text-texto-suave">
            Vizze Compras
            <br />
            Escritório de Engenharia
          </div>
        </div>

        <div className="mb-6 flex gap-8 text-sm">
          <div>
            <div className="text-[11px] text-texto-suave">Obra</div>
            <div className="text-texto">{orcamento.obraNome}</div>
          </div>
          <div>
            <div className="text-[11px] text-texto-suave">Cliente</div>
            <div className="text-texto">{orcamento.cliente}</div>
          </div>
          <div>
            <div className="text-[11px] text-texto-suave">Aprovado por</div>
            <div className="text-texto">{atual.aprovadoPor ?? '—'}</div>
          </div>
        </div>

        <div className="mb-2 text-sm font-bold text-texto">Comparativo por fornecedor</div>
        <p className="mb-3 mt-0 text-xs text-texto-suave">
          Preço cotado por cada fornecedor em cada item. O destacado foi o escolhido.
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-texto-suave">
              <th className="border-b border-borda pb-2 text-left font-normal">Item</th>
              {fornecedores.map((nome) => (
                <th key={nome} className="border-b border-borda pb-2 text-left font-normal">{nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atual.itens.map((item) => (
              <tr key={item.item}>
                <td className="border-b border-borda py-2 text-texto">{item.item}</td>
                {fornecedores.map((nome) => {
                  const valor = item.porFornecedor[nome];
                  const selecionado = nome === item.fornecedorEscolhido;
                  return (
                    <td
                      key={nome}
                      className={`border-b border-borda py-2 ${selecionado ? 'font-bold text-texto' : 'text-texto-suave'}`}
                    >
                      {valor !== undefined ? formatMoeda(valor) : '—'}
                      {selecionado && <span className="ml-1 text-[10px]">· escolhido</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-6 mt-4 grid grid-cols-3 gap-3">
          {Object.entries(atual.totaisPorFornecedor).map(([nome, valorTotal]) => (
            <div key={nome} className="rounded-xl bg-fundo p-3">
              <div className="text-[11px] text-texto-suave">Total {nome}</div>
              <div className="text-sm font-bold text-texto">{formatMoeda(valorTotal)}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-sm font-bold text-texto">Resumo final — itens selecionados</div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-texto-suave">
              <th className="border-b border-borda pb-2 text-left font-normal">Item</th>
              <th className="border-b border-borda pb-2 text-left font-normal">Fornecedor escolhido</th>
              <th className="border-b border-borda pb-2 text-left font-normal">Valor</th>
            </tr>
          </thead>
          <tbody>
            {atual.itens.map((item) => (
              <tr key={item.item}>
                <td className="border-b border-borda py-2 text-texto">{item.item}</td>
                <td className="border-b border-borda py-2 text-texto-suave">{item.fornecedorEscolhido}</td>
                <td className="border-b border-borda py-2 text-texto">
                  {formatMoeda(item.porFornecedor[item.fornecedorEscolhido] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3.5 flex justify-end gap-6 text-sm">
          <span className="text-texto-suave">Itens <span className="text-texto">{formatMoeda(subtotal)}</span></span>
          <span className="text-texto-suave">Frete <span className="text-texto">{formatMoeda(atual.frete)}</span></span>
          <span className="font-bold text-texto">Total {formatMoeda(total)}</span>
        </div>
      </div>

      <div className="flex justify-center gap-2 print:hidden">
        <Link to="/orcamentos" className={btnSecondary}>Voltar para orçamentos</Link>
        <button className={btnPrimary} onClick={() => window.print()}>Baixar PDF</button>
      </div>
    </AppShell>
  );
}
