/**
 * DMC:    VIZ-90-00-00-400E
 * Título: Painel e administração › Painel analítico › Etapa com maior atraso
 * BREX:   VIZ-00-00-00-022A
 */
import type { AtrasoEtapa } from '../logic';
import { formatarHoras } from '../logic';

interface Props {
  atrasos: readonly AtrasoEtapa[];
}

export function CalloutAtraso({ atrasos }: Props) {
  const pior = atrasos[0];
  const semAtraso = !pior || pior.totalHorasAtraso <= 0;

  if (semAtraso) {
    return (
      <div className="rounded-xl bg-sucesso-fundo p-4">
        <p className="m-0 text-sm font-bold text-sucesso">🎉 Nenhuma etapa atrasada agora</p>
        <p className="m-0 mt-1 text-xs text-texto-suave">
          Todo orçamento em andamento está dentro da média histórica de cada etapa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-erro-fundo p-4">
      <p className="m-0 text-sm font-bold text-erro">⏱ {pior.rotulo}</p>
      <p className="m-0 mt-1 text-xs text-texto-suave">
        É a etapa com mais atraso agora: {pior.orcamentosAtrasados}{' '}
        {pior.orcamentosAtrasados === 1 ? 'orçamento está' : 'orçamentos estão'} parado{pior.orcamentosAtrasados === 1 ? '' : 's'}{' '}
        nela acima da média histórica ({formatarHoras(pior.mediaHoras)}), somando {formatarHoras(pior.totalHorasAtraso)} de atraso.
      </p>
    </div>
  );
}
