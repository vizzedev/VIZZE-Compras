/**
 * DMC:    VIZ-30-00-10-400A
 * Título: Requisição e cotação › Requisição › PDF para fornecedores
 * BREX:   VIZ-00-00-00-022A
 *
 * O PDF (RFQ) é o que o comprador manda, por fora do sistema, para
 * cada fornecedor cotar. Lê direto do orçamento (`:orcamentoId`), não
 * mais de `location.state` — assim reabrir essa tela depois de editar
 * a requisição mostra os itens atuais. Nome do arquivo ao salvar:
 * "obra - cotação nº - data" (pedido do usuário, ver docs/decisoes.md).
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { btnPrimary, btnSecondary } from '@/components/ui/styles';
import { orcamentosStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { dataHojePtBr, montarNomeDocumento, useTituloDocumento } from '@/lib/nomeDocumentoPdf';

export function RequisicaoPdfPage() {
  const { orcamentoId } = useParams();
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;

  useTituloDocumento(
    orcamento ? montarNomeDocumento(orcamento.obraNome, `Cotação nº ${orcamento.codigoCotacao ?? '—'}`) : 'Vizze Compras',
  );

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento) {
    return <Navigate to="/obras" replace />;
  }

  return (
    <AppShell active="obras" title="Requisição enviada">
      <div className="-mt-3 flex items-center gap-2 rounded-full bg-primaria-fundo px-4 py-3 text-sm text-primaria print:hidden">
        PDF gerado — envie este documento, por fora do sistema, para os fornecedores que você quer cotar.
      </div>

      <div className="mx-auto w-full max-w-[620px] rounded-card bg-superficie p-10 shadow-card print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-texto">Solicitação de cotação nº {orcamento.codigoCotacao ?? '—'}</div>
            <div className="mt-0.5 text-xs text-texto-suave">Emitido em {dataHojePtBr()}</div>
          </div>
          <div className="text-right text-xs text-texto-suave">
            Vizze Compras
            <br />
            Escritório de Engenharia
          </div>
        </div>

        <div className="mb-5 text-sm">
          <div className="text-[11px] text-texto-suave">Obra</div>
          <div className="text-texto">{orcamento.obraNome || '—'}</div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-texto-suave">
              <th className="border-b border-borda pb-2 text-left font-normal">Item</th>
              <th className="border-b border-borda pb-2 text-left font-normal">Quantidade</th>
              <th className="border-b border-borda pb-2 text-left font-normal">Unidade</th>
            </tr>
          </thead>
          <tbody>
            {orcamento.itensRequisicao.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 text-xs text-texto-suave">Nenhum item — abra esta tela a partir da requisição validada.</td>
              </tr>
            ) : (
              orcamento.itensRequisicao.map((item) => (
                <tr key={item.descricao}>
                  <td className="border-b border-borda py-2 text-texto">{item.descricao}</td>
                  <td className="border-b border-borda py-2 text-texto-suave">{item.quantidade}</td>
                  <td className="border-b border-borda py-2 text-texto-suave">{item.unidade}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 print:hidden">
        <Link to="/obras" className={btnSecondary}>Voltar para Obras</Link>
        <button className={btnSecondary} onClick={() => window.print()}>Baixar PDF</button>
        <Link to={`/mapas-cotacao/${orcamento.id}`} className={btnPrimary}>Ir para mapa de cotação</Link>
      </div>
    </AppShell>
  );
}
