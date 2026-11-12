/**
 * DMC:    VIZ-90-00-00-400B
 * Título: Painel e administração › Painel analítico › Estatísticas-resumo
 * BREX:   VIZ-00-00-00-022A
 */
import { card } from '@/components/ui/styles';
import type { AtrasoEtapa, LinhaPainel, MediasGlobais } from '../logic';
import { formatarHoras } from '../logic';

interface Props {
  linhas: readonly LinhaPainel[];
  medias: MediasGlobais;
  atrasos: readonly AtrasoEtapa[];
}

function Tile({ emoji, rotulo, valor }: { emoji: string; rotulo: string; valor: string }) {
  return (
    <div className={`${card} flex-1`}>
      <p className="m-0 text-2xl">{emoji}</p>
      <p className="m-0 mt-2 text-2xl font-bold text-texto">{valor}</p>
      <p className="m-0 text-xs text-texto-suave">{rotulo}</p>
    </div>
  );
}

export function EstatisticasPainel({ linhas, medias, atrasos }: Props) {
  const emAndamento = linhas.filter((l) => l.emAndamento).length;
  const piorEtapa = atrasos[0];
  const temAtraso = piorEtapa && piorEtapa.totalHorasAtraso > 0;

  return (
    <div className="flex flex-wrap gap-4">
      <Tile emoji="📋" rotulo="Orçamentos no painel" valor={String(linhas.length)} />
      <Tile emoji="🚧" rotulo="Em andamento agora" valor={String(emAndamento)} />
      <Tile emoji="⏳" rotulo="Tempo médio até o cliente" valor={formatarHoras(medias.totalAteCliente)} />
      <Tile emoji="📦" rotulo="Tempo médio de entrega" valor={formatarHoras(medias.entrega)} />
      <Tile
        emoji={temAtraso ? '🔥' : '✅'}
        rotulo="Etapa com maior atraso"
        valor={temAtraso ? piorEtapa.rotulo : 'Nenhuma'}
      />
    </div>
  );
}
