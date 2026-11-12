/**
 * DMC:    VIZ-40-20-00-400A
 * Título: Orçamento › Lista de orçamentos
 * BREX:   VIZ-00-00-00-022A
 *
 * Lista TODO orçamento desde o clique em "+ Novo orçamento" — não só
 * os já montados a partir de um comparativo — pedido do usuário. O
 * filtro mostra a etapa atual (`etapaAtual`, em mockData.ts), que
 * também diz quem está com ele agora. Encarregado só vê orçamentos da
 * obra em que foi cadastrado (`podeVerObra`).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, btnSoft, pill, formatMoeda } from '@/components/ui/styles';
import { etapaAtual, orcamentosStore, versaoAtual, type EtapaOrcamento } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { podeVerObra, useSessao } from '@/lib/auth';

const TONS: Record<EtapaOrcamento, { tone: 'neutral' | 'primaria' | 'alerta' | 'erro'; texto: string }> = {
  requisicao: { tone: 'neutral', texto: 'requisição' },
  cotacao: { tone: 'neutral', texto: 'mapa de cotação' },
  comparativo: { tone: 'neutral', texto: 'comparativo' },
  rascunho: { tone: 'neutral', texto: 'rascunho' },
  em_aprovacao: { tone: 'alerta', texto: 'em aprovação' },
  aprovado: { tone: 'primaria', texto: 'aprovado' },
  reprovado: { tone: 'erro', texto: 'reprovado' },
  recebimento_parcial: { tone: 'alerta', texto: 'recebimento parcial' },
  recebido: { tone: 'primaria', texto: 'recebido' },
};

const RESPONSAVEL: Record<EtapaOrcamento, string> = {
  requisicao: 'Com o comprador',
  cotacao: 'Com o comprador',
  comparativo: 'Com o comprador',
  rascunho: 'Com o comprador',
  em_aprovacao: 'Com o engenheiro',
  aprovado: 'Com o encarregado',
  reprovado: 'Concluído',
  recebimento_parcial: 'Com o encarregado',
  recebido: 'Concluído',
};

function rotaDaEtapa(orcamentoId: string, etapa: EtapaOrcamento): string {
  if (etapa === 'requisicao') return `/requisicao/${orcamentoId}`;
  if (etapa === 'cotacao') return `/mapas-cotacao/${orcamentoId}`;
  if (etapa === 'comparativo') return `/comparativo/${orcamentoId}`;
  // aprovado/recebimento_parcial/recebido vão para o detalhe do orçamento
  // (de lá tem link para o PDF do cliente e para o recebimento) — nunca
  // direto para o recebimento, senão o comparativo/PDF ficam inacessíveis.
  return `/orcamento/${orcamentoId}`;
}

const FILTROS: { valor: 'todos' | EtapaOrcamento; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'requisicao', label: 'Requisição' },
  { valor: 'cotacao', label: 'Mapa de cotação' },
  { valor: 'comparativo', label: 'Comparativo' },
  { valor: 'rascunho', label: 'Rascunho' },
  { valor: 'em_aprovacao', label: 'Com engenheiro' },
  { valor: 'aprovado', label: 'Aguardando recebimento' },
  { valor: 'recebimento_parcial', label: 'Recebimento parcial' },
  { valor: 'recebido', label: 'Recebido' },
];

export function OrcamentosPage() {
  const sessao = useSessao();
  const todosOrcamentos = useLista(orcamentosStore);
  const orcamentos = todosOrcamentos.filter((o) => podeVerObra(sessao, o.obraId));
  const [filtro, setFiltro] = useState<'todos' | EtapaOrcamento>('todos');

  if (orcamentos.length === 0) {
    return (
      <AppShell active="orcamentos" title="Orçamentos">
        <div className={card}>
          <p className="m-0 mb-3 text-sm text-texto-suave">Nenhum orçamento criado ainda — comece em "+ Novo orçamento".</p>
          <Link to="/obras" className={btnSoft}>Ir para Obras</Link>
        </div>
      </AppShell>
    );
  }

  const filtrados = orcamentos.filter((orcamento) => filtro === 'todos' || etapaAtual(orcamento) === filtro);

  return (
    <AppShell active="orcamentos" title="Orçamentos">
      <div className="-mt-3 flex flex-wrap gap-2">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.valor}
            onClick={() => setFiltro(opcao.valor)}
            className={
              'rounded-full border px-3.5 py-1.5 text-xs ' +
              (filtro === opcao.valor ? 'border-black/10 bg-black/5 font-bold text-texto' : 'border-borda text-texto-suave')
            }
          >
            {opcao.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className={card}>
          <p className="m-0 text-sm text-texto-suave">Nenhum orçamento com esse filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-hidden rounded-card bg-superficie shadow-card">
          {filtrados.map((orcamento) => {
            const etapa = etapaAtual(orcamento);
            const status = TONS[etapa];
            const montado = orcamento.versoes.length > 0;
            const total = montado
              ? versaoAtual(orcamento).itens.reduce((soma, item) => soma + (item.porFornecedor[item.fornecedorEscolhido] ?? 0), 0) + versaoAtual(orcamento).frete
              : null;
            return (
              <Link
                key={orcamento.id}
                to={rotaDaEtapa(orcamento.id, etapa)}
                className="flex items-center justify-between border-b border-borda p-4 no-underline last:border-0"
              >
                <div>
                  <div className="text-sm font-bold text-texto">
                    {orcamento.codigo}{montado ? ` · versão ${versaoAtual(orcamento).versao}` : ''} · {orcamento.obraNome || 'Obra não escolhida ainda'}
                  </div>
                  <div className="text-xs text-texto-suave">
                    {orcamento.cliente && <>Cliente {orcamento.cliente} · </>}
                    Comprador {orcamento.compradorResponsavel}
                    {total !== null && <> · {formatMoeda(total)}</>} · {RESPONSAVEL[etapa]}
                  </div>
                </div>
                <span className={pill(status.tone)}>{status.texto}</span>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
