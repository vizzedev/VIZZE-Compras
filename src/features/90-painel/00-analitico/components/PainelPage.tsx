/**
 * DMC:    VIZ-90-00-00-400A
 * Título: Painel e administração › Painel analítico do Master
 * BREX:   VIZ-00-00-00-022A
 *
 * Visão do Master sobre todos os orçamentos: etapa atual, quantas
 * revisões e quanto tempo levou cada trecho do fluxo (requisição →
 * mapa de cotação → aprovação do engenheiro → cliente) — pedido do
 * usuário. Guarda de perfil só nesta tela, como em UsuariosPage.
 *
 * Dashboard (tempo médio por etapa, maior desvio, maior atraso) usa
 * sempre a média GLOBAL de todos os orçamentos do painel como
 * referência — não uma meta/SLA cadastrada, que o sistema não tem. A
 * tabela crua continua existindo (recolhida atrás de "Ver tabela"),
 * pela regra de acessibilidade de gráfico: todo gráfico tem uma visão
 * em tabela equivalente.
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, pill } from '@/components/ui/styles';
import { orcamentosStore, type EtapaOrcamento } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { useSessao } from '@/lib/auth';
import { montarPainel, calcularMediasGlobais, calcularDesvios, calcularAtrasoPorEtapa, formatarHoras } from '../logic';
import { EstatisticasPainel } from './EstatisticasPainel';
import { GraficoEtapasMedias } from './GraficoEtapasMedias';
import { ListaDesvios } from './ListaDesvios';
import { CalloutAtraso } from './CalloutAtraso';
import { JornadaOrcamento } from './JornadaOrcamento';

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

export function PainelPage() {
  const sessao = useSessao();
  const orcamentos = useLista(orcamentosStore);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  if (sessao?.perfil !== 'Master') {
    return <Navigate to="/obras" replace />;
  }

  const linhas = montarPainel(orcamentos);

  if (linhas.length === 0) {
    return (
      <AppShell active="painel" title="Painel analítico">
        <div className={card}>
          <p className="m-0 text-sm text-texto-suave">Nenhum orçamento montado ainda — os tempos aparecem aqui conforme o fluxo andar.</p>
        </div>
      </AppShell>
    );
  }

  const medias = calcularMediasGlobais(linhas);
  const desvios = calcularDesvios(linhas, medias);
  const atrasos = calcularAtrasoPorEtapa(linhas, medias);

  return (
    <AppShell active="painel" title="Painel analítico">
      <p className="-mt-3 text-xs text-texto-suave">
        A análise do dashboard compara cada orçamento com a média global de todos os orçamentos do painel.
      </p>

      <EstatisticasPainel linhas={linhas} medias={medias} atrasos={atrasos} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className={card}>
          <p className="m-0 mb-4 text-sm font-bold text-texto">⏱ Tempo médio por etapa</p>
          <GraficoEtapasMedias medias={medias} />
        </div>
        <div className="flex flex-col gap-4">
          <CalloutAtraso atrasos={atrasos} />
          <div className={card}>
            <p className="m-0 mb-3 text-sm font-bold text-texto">📈 Maior desvio da média</p>
            <ListaDesvios desvios={desvios} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="m-0 text-sm font-bold text-texto">Jornada de cada orçamento</p>
        <button onClick={() => setMostrarTabela((v) => !v)} className="text-xs text-texto-suave underline">
          {mostrarTabela ? 'Ver como cartões' : 'Ver tabela'}
        </button>
      </div>

      {mostrarTabela ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-texto-suave">
                <th className="pb-2 pr-3 text-left font-normal">Orçamento</th>
                <th className="pb-2 pr-3 text-left font-normal">Comprador</th>
                <th className="pb-2 pr-3 text-left font-normal">Status</th>
                <th className="pb-2 pr-3 text-left font-normal">Revisões</th>
                <th className="pb-2 pr-3 text-left font-normal">Requisição → Mapa</th>
                <th className="pb-2 pr-3 text-left font-normal">Mapa → Envio p/ aprovação</th>
                <th className="pb-2 pr-3 text-left font-normal">Análise do engenheiro</th>
                <th className="pb-2 text-left font-normal">Total até o cliente</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.orcamentoId} className="border-t border-borda">
                  <td className="py-2 pr-3 text-texto">
                    <div className="font-bold">{linha.codigo}</div>
                    <div className="text-xs text-texto-suave">{linha.obraNome}</div>
                  </td>
                  <td className="py-2 pr-3 text-texto-suave">{linha.compradorResponsavel}</td>
                  <td className="py-2 pr-3">
                    <span className={pill(STATUS_TONE[linha.statusAtual])}>{STATUS_TEXTO[linha.statusAtual]}</span>
                  </td>
                  <td className="py-2 pr-3 text-texto-suave">{linha.revisoes}</td>
                  <td className="py-2 pr-3 text-texto-suave">{formatarHoras(linha.horasRequisicaoAteMapa)}</td>
                  <td className="py-2 pr-3 text-texto-suave">{formatarHoras(linha.horasMapaAteEnvioAprovacao)}</td>
                  <td className="py-2 pr-3 text-texto-suave">{formatarHoras(linha.horasAnaliseEngenheiro)}</td>
                  <td className="py-2 text-texto-suave">
                    {formatarHoras(linha.horasTotalAteCliente)}
                    {linha.emAndamento && <span className="ml-1 text-[11px] text-alerta">(em andamento)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {linhas.map((linha) => (
            <JornadaOrcamento key={linha.orcamentoId} linha={linha} medias={medias} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
