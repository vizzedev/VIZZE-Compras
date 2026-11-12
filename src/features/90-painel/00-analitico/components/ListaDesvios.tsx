/**
 * DMC:    VIZ-90-00-00-400D
 * Título: Painel e administração › Painel analítico › Orçamentos com maior desvio
 * BREX:   VIZ-00-00-00-022A
 *
 * Barra divergente centrada em zero: cresce pra direita (acima da
 * média — erro, "atrasado") ou pra esquerda (abaixo da média —
 * sucesso, "adiantado"). Só os 5 maiores desvios em módulo — o resto
 * fica implícito na média do gráfico ao lado.
 */
import { Link } from 'react-router-dom';
import type { DesvioOrcamento } from '../logic';
import { formatarHoras } from '../logic';

interface Props {
  desvios: readonly DesvioOrcamento[];
}

const LIMITE = 5;

export function ListaDesvios({ desvios }: Props) {
  if (desvios.length === 0) {
    return <p className="m-0 text-xs text-texto-suave">Nenhum orçamento concluído até o cliente ainda.</p>;
  }

  const top = desvios.slice(0, LIMITE);
  const maiorModulo = Math.max(1, ...top.map((d) => Math.abs(d.desvioHoras)));

  return (
    <div className="flex flex-col gap-3">
      {top.map((d) => {
        const atrasado = d.desvioHoras > 0;
        const largura = Math.min(100, (Math.abs(d.desvioHoras) / maiorModulo) * 100);
        return (
          <Link
            key={d.orcamentoId}
            to={`/orcamento/${d.orcamentoId}`}
            className="block rounded-xl p-2 no-underline hover:bg-fundo"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-texto">
                {d.codigo} <span className="font-normal text-texto-suave">· {d.obraNome}</span>
              </span>
              <span className={atrasado ? 'font-medium text-erro' : 'font-medium text-sucesso'}>
                {atrasado ? '+' : '−'}
                {formatarHoras(Math.abs(d.desvioHoras))}
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-fundo">
              <div className="absolute inset-y-0 left-1/2 w-px bg-borda" />
              <div
                className={`absolute inset-y-0 h-2.5 rounded-full ${atrasado ? 'bg-erro' : 'bg-sucesso'}`}
                style={
                  atrasado
                    ? { left: '50%', width: `${largura / 2}%` }
                    : { right: '50%', width: `${largura / 2}%` }
                }
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
