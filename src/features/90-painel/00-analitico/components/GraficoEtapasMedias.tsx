/**
 * DMC:    VIZ-90-00-00-400C
 * Título: Painel e administração › Painel analítico › Gráfico de tempo médio por etapa
 * BREX:   VIZ-00-00-00-022A
 *
 * Barra horizontal por etapa, uma cor categórica fixa por etapa (não é
 * "série" no sentido de legenda — cada barra já tem o nome da etapa ao
 * lado, então dispensa caixa de legenda). Cresce de uma baseline comum
 * à esquerda, cap de 24px de espessura, ponta arredondada.
 */
import type { MediasGlobais } from '../logic';
import { formatarHoras } from '../logic';

interface Props {
  medias: MediasGlobais;
}

const BARRAS: { chave: keyof MediasGlobais; rotulo: string; cor: string }[] = [
  { chave: 'requisicaoAteMapa', rotulo: 'Requisição → Mapa', cor: 'bg-serie-1' },
  { chave: 'mapaAteEnvio', rotulo: 'Mapa → Envio p/ aprovação', cor: 'bg-serie-2' },
  { chave: 'analiseEngenheiro', rotulo: 'Análise do engenheiro', cor: 'bg-serie-3' },
  { chave: 'entrega', rotulo: 'Aprovado → NF anexada (entrega)', cor: 'bg-serie-4' },
];

export function GraficoEtapasMedias({ medias }: Props) {
  const valores = BARRAS.map((b) => medias[b.chave] ?? 0);
  const maior = Math.max(1, ...valores);

  return (
    <div className="flex flex-col gap-3.5">
      {BARRAS.map((barra) => {
        const horas = medias[barra.chave];
        const largura = horas === null ? 0 : Math.max(4, (horas / maior) * 100);
        return (
          <div key={barra.chave}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-texto">{barra.rotulo}</span>
              <span className="text-texto-suave">{formatarHoras(horas)}</span>
            </div>
            <div className="h-6 w-full rounded-full bg-fundo">
              <div
                className={`h-6 rounded-full ${barra.cor}`}
                style={{ width: `${largura}%` }}
                title={`${barra.rotulo}: ${formatarHoras(horas)} em média`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
