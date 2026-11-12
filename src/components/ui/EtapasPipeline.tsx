/**
 * DMC:    VIZ-00-00-00-400D
 * Título: Núcleo › Trilha de etapas do orçamento (voltar/avançar)
 * BREX:   VIZ-00-00-00-022A
 *
 * Mostrado em Requisição, Mapa de cotação, Comparativo e Orçamento —
 * deixa voltar para revisar/editar uma etapa já alcançada e avançar de
 * novo, sem perder o progresso (`rankEtapa`/`avancarEtapa` em
 * mockData.ts cuidam de nunca regredir o status guardado).
 */
import { Link } from 'react-router-dom';
import { rankEtapa, type EtapaOrcamento } from '@/lib/mockData';

const PASSOS: { readonly etapa: EtapaOrcamento; readonly label: string; readonly rota: (id: string) => string }[] = [
  { etapa: 'requisicao', label: 'Requisição', rota: (id) => `/requisicao/${id}` },
  { etapa: 'cotacao', label: 'Mapa de cotação', rota: (id) => `/mapas-cotacao/${id}` },
  { etapa: 'comparativo', label: 'Comparativo', rota: (id) => `/comparativo/${id}` },
  { etapa: 'rascunho', label: 'Orçamento', rota: (id) => `/orcamento/${id}` },
];

interface EtapasPipelineProps {
  readonly orcamentoId: string;
  readonly etapaAlcancada: EtapaOrcamento;
  readonly atual: EtapaOrcamento;
}

export function EtapasPipeline({ orcamentoId, etapaAlcancada, atual }: EtapasPipelineProps) {
  const rankAlcancado = rankEtapa(etapaAlcancada);

  return (
    <div className="-mt-3 flex flex-wrap gap-1.5 print:hidden">
      {PASSOS.map((passo, indice) => {
        const alcancavel = rankEtapa(passo.etapa) <= rankAlcancado;
        const ativo = passo.etapa === atual || (passo.etapa === 'rascunho' && rankEtapa(atual) >= rankEtapa('rascunho'));
        const conteudo = (
          <span
            className={
              'rounded-full px-3 py-1.5 text-xs ' +
              (ativo
                ? 'border border-black/10 bg-black/5 font-bold text-texto'
                : alcancavel
                  ? 'text-texto-suave'
                  : 'text-borda')
            }
          >
            {indice + 1}. {passo.label}
          </span>
        );
        return alcancavel ? (
          <Link key={passo.etapa} to={passo.rota(orcamentoId)} className="no-underline">
            {conteudo}
          </Link>
        ) : (
          <span key={passo.etapa}>{conteudo}</span>
        );
      })}
    </div>
  );
}
