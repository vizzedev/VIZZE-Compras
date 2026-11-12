/**
 * DMC:    VIZ-90-00-00-200A
 * Título: Painel e administração › Painel analítico › Lógica
 * BREX:   VIZ-00-00-00-022A
 *
 * Pré-condição: funciona com qualquer orçamento, incluindo um recém
 * criado (sem itens, sem versão nenhuma) — devolve `null` no trecho
 * que ainda não aconteceu em vez de quebrar. Etapa ainda não concluída
 * usa "agora" como fim provisório, para o painel mostrar o tempo
 * decorrido de quem está em andamento.
 *
 * `etapaEmAberto` identifica qual dos 4 trechos cronometrados ainda
 * está correndo (tem início mas não tem fim) — é contra ele que
 * `calcularAtrasoPorEtapa` compara o tempo decorrido com a média
 * global, pra achar quem está "atrasado" de verdade (acima da média
 * histórica), não só "ainda não terminou".
 *
 * `horasEntrega` é o 4º trecho, depois da aprovação: do momento que o
 * engenheiro aprova até a PRIMEIRA nota fiscal ser anexada na obra
 * (primeiro `Recebimento`, nunca o último — "tempo de entrega" aqui é
 * sobre a obra começar a receber, não sobre tudo ter chegado).
 */
import type { EtapaOrcamento, Orcamento } from '@/lib/mockData';
import { etapaAtual } from '@/lib/mockData';

export type EtapaCronometrada = 'requisicao' | 'mapa' | 'analise' | 'entrega';

export interface LinhaPainel {
  readonly orcamentoId: string;
  readonly codigo: string;
  readonly obraNome: string;
  readonly compradorResponsavel: string;
  readonly statusAtual: EtapaOrcamento;
  readonly revisoes: number;
  readonly horasRequisicaoAteMapa: number | null;
  readonly horasMapaAteEnvioAprovacao: number | null;
  readonly horasAnaliseEngenheiro: number | null;
  readonly horasTotalAteCliente: number | null;
  readonly horasEntrega: number | null;
  readonly emAndamento: boolean;
  readonly etapaEmAberto: EtapaCronometrada | null;
}

function horasEntre(inicioIso: string | undefined, fimIso: string | undefined): number | null {
  if (!inicioIso) return null;
  const inicio = new Date(inicioIso).getTime();
  const fim = fimIso ? new Date(fimIso).getTime() : Date.now();
  return (fim - inicio) / 3_600_000;
}

function detectarEtapaEmAberto(
  orcamento: Orcamento,
  primeiraVersao: Orcamento['versoes'][number] | undefined,
  atual: Orcamento['versoes'][number] | undefined,
  versaoAprovada: Orcamento['versoes'][number] | undefined,
): EtapaCronometrada | null {
  if (orcamento.requisicaoEnviadaEm && !orcamento.mapaMontadoEm) return 'requisicao';
  if (orcamento.mapaMontadoEm && !primeiraVersao?.enviadaParaAprovacaoEm) return 'mapa';
  if (atual?.enviadaParaAprovacaoEm && !versaoAprovada && atual.status === 'em_aprovacao') return 'analise';
  if (versaoAprovada && orcamento.recebimentos.length === 0) return 'entrega';
  return null;
}

export function montarPainel(orcamentos: readonly Orcamento[]): readonly LinhaPainel[] {
  return orcamentos.map((orcamento) => {
    const status = etapaAtual(orcamento);
    const atual = orcamento.versoes.length > 0 ? orcamento.versoes[orcamento.versoes.length - 1] : undefined;
    const primeiraVersao = orcamento.versoes[0];
    const versaoAprovada = orcamento.versoes.find((v) => v.status === 'aprovado');
    const revisoes = orcamento.versoes.filter((v) => v.status === 'reprovado').length;
    const primeiroRecebimento = orcamento.recebimentos[0];

    return {
      orcamentoId: orcamento.id,
      codigo: orcamento.codigo,
      obraNome: orcamento.obraNome,
      compradorResponsavel: orcamento.compradorResponsavel,
      statusAtual: status,
      revisoes,
      horasRequisicaoAteMapa: horasEntre(orcamento.requisicaoEnviadaEm, orcamento.mapaMontadoEm),
      horasMapaAteEnvioAprovacao: horasEntre(orcamento.mapaMontadoEm, primeiraVersao?.enviadaParaAprovacaoEm),
      horasAnaliseEngenheiro: versaoAprovada
        ? horasEntre(versaoAprovada.enviadaParaAprovacaoEm, versaoAprovada.decididaEm)
        : horasEntre(atual?.enviadaParaAprovacaoEm, atual?.status === 'em_aprovacao' ? undefined : atual?.decididaEm),
      horasTotalAteCliente: horasEntre(orcamento.mapaMontadoEm, versaoAprovada?.decididaEm),
      horasEntrega: versaoAprovada ? horasEntre(versaoAprovada.decididaEm, primeiroRecebimento?.recebidoEm) : null,
      // "em andamento" aqui é sobre o ciclo de aprovação do orçamento (até ir pro cliente),
      // não sobre o recebimento do material — por isso não usa `status` direto.
      emAndamento: !versaoAprovada,
      etapaEmAberto: detectarEtapaEmAberto(orcamento, primeiraVersao, atual, versaoAprovada),
    };
  });
}

export interface MediasGlobais {
  readonly requisicaoAteMapa: number | null;
  readonly mapaAteEnvio: number | null;
  readonly analiseEngenheiro: number | null;
  readonly totalAteCliente: number | null;
  readonly entrega: number | null;
}

function media(valores: readonly (number | null)[]): number | null {
  const validos = valores.filter((v): v is number => v !== null);
  if (validos.length === 0) return null;
  return validos.reduce((soma, v) => soma + v, 0) / validos.length;
}

/** Pré-condição: `linhas` já vem de `montarPainel` — média calculada só sobre os trechos já medidos (não-nulos). */
export function calcularMediasGlobais(linhas: readonly LinhaPainel[]): MediasGlobais {
  return {
    requisicaoAteMapa: media(linhas.map((l) => l.horasRequisicaoAteMapa)),
    mapaAteEnvio: media(linhas.map((l) => l.horasMapaAteEnvioAprovacao)),
    analiseEngenheiro: media(linhas.map((l) => l.horasAnaliseEngenheiro)),
    totalAteCliente: media(linhas.map((l) => l.horasTotalAteCliente)),
    entrega: media(linhas.map((l) => l.horasEntrega)),
  };
}

export interface DesvioOrcamento {
  readonly orcamentoId: string;
  readonly codigo: string;
  readonly obraNome: string;
  readonly horasTotal: number;
  readonly desvioHoras: number;
}

/** Desvio = horas totais até o cliente menos a média global — ordenado do maior desvio (em módulo) pro menor. */
export function calcularDesvios(linhas: readonly LinhaPainel[], medias: MediasGlobais): readonly DesvioOrcamento[] {
  if (medias.totalAteCliente === null) return [];
  const mediaTotal = medias.totalAteCliente;
  return linhas
    .filter((l) => l.horasTotalAteCliente !== null)
    .map((l) => ({
      orcamentoId: l.orcamentoId,
      codigo: l.codigo,
      obraNome: l.obraNome,
      horasTotal: l.horasTotalAteCliente as number,
      desvioHoras: (l.horasTotalAteCliente as number) - mediaTotal,
    }))
    .sort((a, b) => Math.abs(b.desvioHoras) - Math.abs(a.desvioHoras));
}

export interface AtrasoEtapa {
  readonly etapa: EtapaCronometrada;
  readonly rotulo: string;
  readonly mediaHoras: number | null;
  readonly totalHorasAtraso: number;
  readonly orcamentosAtrasados: number;
}

const DEFINICAO_ETAPAS: readonly { etapa: EtapaCronometrada; rotulo: string }[] = [
  { etapa: 'requisicao', rotulo: 'Requisição → Mapa' },
  { etapa: 'mapa', rotulo: 'Mapa → Envio p/ aprovação' },
  { etapa: 'analise', rotulo: 'Análise do engenheiro' },
  { etapa: 'entrega', rotulo: 'Aprovado → NF anexada' },
];

function valorDaEtapa(linha: LinhaPainel, etapa: EtapaCronometrada): number | null {
  if (etapa === 'requisicao') return linha.horasRequisicaoAteMapa;
  if (etapa === 'mapa') return linha.horasMapaAteEnvioAprovacao;
  if (etapa === 'analise') return linha.horasAnaliseEngenheiro;
  return linha.horasEntrega;
}

function mediaDaEtapa(medias: MediasGlobais, etapa: EtapaCronometrada): number | null {
  if (etapa === 'requisicao') return medias.requisicaoAteMapa;
  if (etapa === 'mapa') return medias.mapaAteEnvio;
  if (etapa === 'analise') return medias.analiseEngenheiro;
  return medias.entrega;
}

/**
 * "Atraso" aqui é só sobre quem ainda está correndo: compara o tempo já
 * decorrido no trecho aberto (`etapaEmAberto`) com a média histórica
 * daquele mesmo trecho — nunca com uma meta/SLA que o sistema não tem.
 * Ordenado da etapa com mais atraso acumulado pra menos.
 */
export function calcularAtrasoPorEtapa(linhas: readonly LinhaPainel[], medias: MediasGlobais): readonly AtrasoEtapa[] {
  return DEFINICAO_ETAPAS.map(({ etapa, rotulo }) => {
    const mediaEtapa = mediaDaEtapa(medias, etapa);
    const abertas = linhas.filter((l) => l.etapaEmAberto === etapa);
    let totalHorasAtraso = 0;
    let orcamentosAtrasados = 0;
    for (const linha of abertas) {
      const horas = valorDaEtapa(linha, etapa);
      if (horas === null || mediaEtapa === null) continue;
      const excesso = horas - mediaEtapa;
      if (excesso > 0) {
        totalHorasAtraso += excesso;
        orcamentosAtrasados += 1;
      }
    }
    return { etapa, rotulo, mediaHoras: mediaEtapa, totalHorasAtraso, orcamentosAtrasados };
  }).sort((a, b) => b.totalHorasAtraso - a.totalHorasAtraso);
}

export function formatarHoras(horas: number | null): string {
  if (horas === null) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 24) return `${horas.toFixed(1)} h`;
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas % 24);
  return `${dias} d ${resto} h`;
}
