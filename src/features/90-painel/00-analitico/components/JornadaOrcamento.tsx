/**
 * DMC:    VIZ-90-00-00-400F
 * Título: Painel e administração › Painel analítico › Jornada lúdica do orçamento
 * BREX:   VIZ-00-00-00-022A
 *
 * Substitui a linha de tabela crua por um cartão com uma barra
 * segmentada (uma cor por etapa cronometrada, proporcional ao tempo
 * gasto) — a mesma ideia de "barra de progresso de jogo", pra bater o
 * olho e entender onde o tempo foi sem ler números. O rótulo da etapa
 * em aberto pisca com `animate-pulse` (lúdico, mas sutil — só ali).
 */
import { Link } from 'react-router-dom';
import { pill } from '@/components/ui/styles';
import type { EtapaOrcamento } from '@/lib/mockData';
import type { LinhaPainel, MediasGlobais } from '../logic';
import { formatarHoras } from '../logic';

interface Props {
  linha: LinhaPainel;
  medias: MediasGlobais;
}

const STATUS_TEXTO: Record<EtapaOrcamento, string> = {
  requisicao: 'requisição',
  cotacao: 'mapa de cotação',
  comparativo: 'comparativo',
  rascunho: 'rascunho',
  em_aprovacao: 'em aprovação',
  aprovado: 'aguardando recebimento',
  reprovado: 'reprovado',
  recebimento_parcial: 'recebimento parcial',
  recebido: 'recebido',
};

const STATUS_TONE: Record<EtapaOrcamento, 'neutral' | 'primaria' | 'alerta' | 'erro'> = {
  requisicao: 'neutral',
  cotacao: 'neutral',
  comparativo: 'neutral',
  rascunho: 'neutral',
  em_aprovacao: 'alerta',
  aprovado: 'alerta',
  recebimento_parcial: 'alerta',
  recebido: 'primaria',
  reprovado: 'erro',
};

const SEGMENTOS: { chave: 'horasRequisicaoAteMapa' | 'horasMapaAteEnvioAprovacao' | 'horasAnaliseEngenheiro' | 'horasEntrega'; etapa: 'requisicao' | 'mapa' | 'analise' | 'entrega'; emoji: string; cor: string }[] = [
  { chave: 'horasRequisicaoAteMapa', etapa: 'requisicao', emoji: '📝', cor: 'bg-serie-1' },
  { chave: 'horasMapaAteEnvioAprovacao', etapa: 'mapa', emoji: '📊', cor: 'bg-serie-2' },
  { chave: 'horasAnaliseEngenheiro', etapa: 'analise', emoji: '🔍', cor: 'bg-serie-3' },
  { chave: 'horasEntrega', etapa: 'entrega', emoji: '📦', cor: 'bg-serie-4' },
];

export function JornadaOrcamento({ linha, medias }: Props) {
  const total = SEGMENTOS.reduce((soma, s) => soma + (linha[s.chave] ?? 0), 0) || 1;
  const desvio = linha.horasTotalAteCliente !== null && medias.totalAteCliente !== null
    ? linha.horasTotalAteCliente - medias.totalAteCliente
    : null;

  return (
    <Link
      to={`/orcamento/${linha.orcamentoId}`}
      className="block rounded-card bg-superficie p-4 no-underline shadow-card"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-texto">{linha.codigo}</span>
          <span className="ml-2 text-xs text-texto-suave">{linha.obraNome} · {linha.compradorResponsavel}</span>
        </div>
        <div className="flex items-center gap-2">
          {desvio !== null && (
            <span className={`text-xs font-medium ${desvio > 0 ? 'text-erro' : 'text-sucesso'}`}>
              {desvio > 0 ? `🐢 +${formatarHoras(desvio)} vs. média` : `⚡ ${formatarHoras(Math.abs(desvio))} abaixo da média`}
            </span>
          )}
          <span className={pill(STATUS_TONE[linha.statusAtual])}>{STATUS_TEXTO[linha.statusAtual]}</span>
        </div>
      </div>

      <div className="flex h-5 w-full overflow-hidden rounded-full bg-fundo">
        {SEGMENTOS.map((s) => {
          const horas = linha[s.chave];
          if (!horas) return null;
          const largura = (horas / total) * 100;
          const aberto = linha.etapaEmAberto === s.etapa;
          return (
            <div
              key={s.etapa}
              className={`h-5 ${s.cor} ${aberto ? 'animate-pulse' : ''}`}
              style={{ width: `${largura}%` }}
              title={`${s.emoji} ${formatarHoras(horas)}`}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-4 text-[11px] text-texto-suave">
        {SEGMENTOS.map((s) => (
          <span key={s.etapa}>
            {s.emoji} {formatarHoras(linha[s.chave])}
          </span>
        ))}
        {linha.revisoes > 0 && <span>🔁 {linha.revisoes} revisão{linha.revisoes > 1 ? 'ões' : ''}</span>}
      </div>
    </Link>
  );
}
