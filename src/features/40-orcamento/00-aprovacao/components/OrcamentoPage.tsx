// brex-excecao P10-04: componente já grande antes desta rodada de correções
// (4 status × edição/aprovação/reprovação no mesmo lugar); extrair o
// histórico já ajudou (HistoricoOrcamento.tsx) — o resto (tabela de itens +
// ações) compartilha estado demais pra valer a pena fatiar agora.
/**
 * DMC:    VIZ-40-00-00-400A
 * Título: Orçamento › Detalhe, aprovação e fluxo comprador ⇄ engenheiro
 * BREX:   VIZ-00-00-00-022A
 *
 * Dono atual do orçamento deriva do status: `rascunho` → comprador
 * (edita livremente, mutando a própria versão); `em_aprovacao` →
 * engenheiro (comprador fica travado); `aprovado`/`reprovado` →
 * decidido. Reprovar sempre cria uma nova versão em `rascunho` — nunca
 * reenvia automaticamente — e nunca sobrescreve a versão reprovada,
 * que fica só como registro no histórico. Cada transição gera uma
 * notificação para quem precisa agir a seguir (ver `notificacoesStore`).
 * Aprovar/reprovar/editar aprovado é restrito a Engenheiro e Master —
 * primeira ação com perfil de verdade travando algo nesta aplicação,
 * necessário agora que o Encarregado existe e NÃO pode fazer isso.
 * Enviar para aprovação também não é tarefa do Encarregado (só cria
 * requisição e dá recebimento).
 */
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { EtapasPipeline } from '@/components/ui/EtapasPipeline';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { HistoricoOrcamento } from './HistoricoOrcamento';
import { card, input, btnPrimary, btnSecondary, btnDanger, btnSoft, pill, formatMoeda } from '@/components/ui/styles';
import { agora, notificacoesStore, orcamentosStore, statusRecebimento, versaoAtual, type ItemOrcamento } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { podeVerObra, useSessao } from '@/lib/auth';

const STATUS_PILL = {
  rascunho: { tone: 'neutral' as const, texto: 'rascunho' },
  em_aprovacao: { tone: 'alerta' as const, texto: 'em aprovação' },
  aprovado: { tone: 'primaria' as const, texto: 'aprovado' },
  reprovado: { tone: 'erro' as const, texto: 'reprovado' },
};

const RECEBIMENTO_TEXTO: Record<string, string> = {
  aprovado: 'Aguardando recebimento',
  recebimento_parcial: 'Recebimento parcial',
  recebido: 'Recebido por completo',
};

export function OrcamentoPage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  const sessao = useSessao();
  useLista(orcamentosStore); // reage a enviar/aprovar/reprovar/editar
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;
  const [justificativa, setJustificativa] = useState('');
  const [itensMarcados, setItensMarcados] = useState<ReadonlySet<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [itensEdicao, setItensEdicao] = useState<readonly ItemOrcamento[]>([]);
  const [freteEdicao, setFreteEdicao] = useState('0');
  const [notaEdicao, setNotaEdicao] = useState('');

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento || !podeVerObra(sessao, orcamento.obraId)) {
    return <Navigate to="/orcamentos" replace />;
  }

  const atual = versaoAtual(orcamento);
  const itensExibidos = editando ? itensEdicao : atual.itens;
  const subtotal = itensExibidos.reduce((soma, item) => soma + (item.porFornecedor[item.fornecedorEscolhido] ?? 0), 0);
  const status = STATUS_PILL[atual.status];
  const nomeSessao = () => `${sessao?.nome ?? 'Engenheiro'} (${sessao?.perfil ?? 'Engenheiro'})`;
  const emRascunho = atual.status === 'rascunho';
  const modoEdicaoItens = editando || emRascunho;
  const podeAprovar = sessao?.perfil === 'Engenheiro' || sessao?.perfil === 'Master';
  const podeEnviarParaAprovacao = sessao?.perfil !== 'Encarregado';

  function substituirVersaoAtual(dados: Partial<ReturnType<typeof versaoAtual>>) {
    const novasVersoes = orcamento!.versoes.map((v, i) => (i === orcamento!.versoes.length - 1 ? { ...v, ...dados } : v));
    orcamentosStore.atualizar(orcamento!.id, { versoes: novasVersoes });
  }

  function alternarMarcacao(item: string) {
    setItensMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(item)) novo.delete(item);
      else novo.add(item);
      return novo;
    });
  }

  function trocarFornecedorRascunho(item: string, novoFornecedor: string) {
    substituirVersaoAtual({ itens: atual.itens.map((i) => (i.item === item ? { ...i, fornecedorEscolhido: novoFornecedor } : i)) });
  }

  function atualizarFreteRascunho(valor: string) {
    const numero = Number.parseFloat(valor.replace(',', '.'));
    if (Number.isFinite(numero)) substituirVersaoAtual({ frete: numero });
  }

  function enviarParaAprovacao() {
    substituirVersaoAtual({ status: 'em_aprovacao', enviadaParaAprovacaoEm: agora() });
    notificacoesStore.adicionar({
      perfilDestino: 'Engenheiro',
      mensagem: `Orçamento ${orcamento!.codigo} (${orcamento!.obraNome}) aguardando aprovação.`,
      orcamentoId: orcamento!.id,
      criadaEm: agora(),
      lida: false,
    });
    navigate('/orcamentos');
  }

  function aprovar() {
    substituirVersaoAtual({ status: 'aprovado', aprovadoPor: nomeSessao(), decididaEm: agora() });
    navigate(`/orcamento/${orcamento!.id}/pdf`);
  }

  function reprovar() {
    if (!justificativa.trim()) {
      setErro('Justifique a reprovação antes de enviar.');
      return;
    }
    const agoraIso = agora();
    const versaoReprovada = {
      ...atual,
      status: 'reprovado' as const,
      justificativa,
      decididaEm: agoraIso,
      // Reaproveita `aprovadoPor` pra registrar quem decidiu, aprovando ou
      // reprovando — não existe um campo separado "reprovadoPor".
      aprovadoPor: nomeSessao(),
      itens: atual.itens.map((item) => ({ ...item, pontoAtencao: itensMarcados.has(item.item) })),
    };
    const novaVersao = {
      ...atual,
      versao: atual.versao + 1,
      status: 'rascunho' as const,
      criadaEm: agoraIso,
      // Os itens levam a marcação de "ponto de atenção" pro rascunho novo —
      // sem isso, o comprador não vê quais itens o engenheiro apontou,
      // porque a marcação só existia na cópia arquivada em `versaoReprovada`.
      itens: versaoReprovada.itens,
      justificativa: undefined,
      aprovadoPor: undefined,
      enviadaParaAprovacaoEm: undefined,
      decididaEm: undefined,
    };
    orcamentosStore.atualizar(orcamento!.id, { versoes: [...orcamento!.versoes.slice(0, -1), versaoReprovada, novaVersao] });
    notificacoesStore.adicionar({
      perfilDestino: 'Comprador',
      usuarioDestino: orcamento!.compradorResponsavel,
      mensagem: `Orçamento ${orcamento!.codigo} (${orcamento!.obraNome}) foi reprovado: "${justificativa}"`,
      orcamentoId: orcamento!.id,
      criadaEm: agoraIso,
      lida: false,
    });
    navigate('/orcamentos');
  }

  function iniciarEdicao() {
    setItensEdicao(atual.itens);
    setFreteEdicao(String(atual.frete));
    setNotaEdicao('');
    setEditando(true);
  }

  function trocarFornecedorDoItem(item: string, novoFornecedor: string) {
    setItensEdicao((atual) => atual.map((i) => (i.item === item ? { ...i, fornecedorEscolhido: novoFornecedor } : i)));
  }

  function salvarEdicao() {
    const freteNumero = Number.parseFloat(freteEdicao.replace(',', '.'));
    const novaVersao = {
      ...atual,
      versao: atual.versao + 1,
      status: 'aprovado' as const,
      criadaEm: agora(),
      itens: itensEdicao,
      frete: Number.isFinite(freteNumero) ? freteNumero : atual.frete,
      aprovadoPor: atual.aprovadoPor,
      editadoPor: nomeSessao(),
      notaEdicao: notaEdicao.trim() || undefined,
      justificativa: undefined,
    };
    orcamentosStore.atualizar(orcamento!.id, { versoes: [...orcamento!.versoes, novaVersao] });
    setEditando(false);
  }

  const podeEditarAprovado = atual.status === 'aprovado' && !editando && podeAprovar;
  const recebimento = atual.status === 'aprovado' ? statusRecebimento(orcamento) : null;
  // Só mostra o banner de reprovação na versão que nasceu dela (a imediatamente seguinte) —
  // não em rascunhos mais antigos ou já reenviados depois.
  const ultimaReprovacao = emRascunho
    ? orcamento.versoes.find((v) => v.status === 'reprovado' && v.versao === atual.versao - 1)
    : undefined;

  return (
    <AppShell active="orcamentos" backTo="/orcamentos" backLabel="Orçamentos" title={`Orçamento ${orcamento.codigo} · versão ${atual.versao}`}>
      <EtapasPipeline orcamentoId={orcamento.id} etapaAlcancada={orcamento.etapa} atual={atual.status} />
      <p className="-mt-3 text-xs text-texto-suave">
        Obra {orcamento.obraNome} · Cliente {orcamento.cliente} · Comprador {orcamento.compradorResponsavel}
      </p>
      <span className={pill(status.tone)}>{status.texto}{editando ? ' · editando' : ''}</span>

      {ultimaReprovacao && (
        <div className="rounded-card bg-erro-fundo p-4">
          <p className="m-0 text-sm font-bold text-erro">
            Reprovado por {ultimaReprovacao.aprovadoPor ?? 'o engenheiro'}
          </p>
          <p className="m-0 mt-1 text-sm text-texto">"{ultimaReprovacao.justificativa}"</p>
          <p className="m-0 mt-1 text-xs text-texto-suave">
            Os itens marcados como "ponto de atenção" na tabela abaixo foram os apontados para revisão.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        <div className="flex flex-[2] flex-col gap-4" style={{ minWidth: 340 }}>
          <div className={card}>
            <div className="mb-2.5 text-sm font-bold text-texto">Itens do orçamento</div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs text-texto-suave">
                  <th className="pb-2 text-left font-normal">Item</th>
                  <th className="pb-2 text-left font-normal">Fornecedor</th>
                  <th className="pb-2 text-left font-normal">Valor</th>
                  {atual.status === 'em_aprovacao' && <th className="pb-2 text-left font-normal">Ponto de atenção</th>}
                </tr>
              </thead>
              <tbody>
                {itensExibidos.map((item) => (
                  <tr key={item.item}>
                    <td className="py-1.5 pr-2 text-texto">{item.item}</td>
                    <td className="py-1.5 pr-2 text-texto-suave">
                      {modoEdicaoItens ? (
                        <select
                          className={input}
                          value={item.fornecedorEscolhido}
                          onChange={(e) => (editando ? trocarFornecedorDoItem(item.item, e.target.value) : trocarFornecedorRascunho(item.item, e.target.value))}
                        >
                          {Object.keys(item.porFornecedor).map((nome) => (
                            <option key={nome} value={nome}>{nome}</option>
                          ))}
                        </select>
                      ) : (
                        item.fornecedorEscolhido
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-texto">{formatMoeda(item.porFornecedor[item.fornecedorEscolhido] ?? 0)}</td>
                    {atual.status === 'em_aprovacao' ? (
                      <td className="py-1.5">
                        <label className="flex items-center gap-1.5 text-xs text-texto-suave">
                          <input type="checkbox" checked={itensMarcados.has(item.item)} onChange={() => alternarMarcacao(item.item)} />
                          marcar
                        </label>
                      </td>
                    ) : (
                      item.pontoAtencao && <td><span className={pill('alerta')}>ponto de atenção</span></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-6 text-sm">
              <span className="text-texto-suave">Subtotal <span className="text-texto">{formatMoeda(subtotal)}</span></span>
              {modoEdicaoItens ? (
                <span className="flex items-center gap-2 text-texto-suave">
                  Frete
                  <input
                    className={`${input} w-28`}
                    value={editando ? freteEdicao : String(atual.frete)}
                    onChange={(e) => (editando ? setFreteEdicao(e.target.value) : atualizarFreteRascunho(e.target.value))}
                  />
                </span>
              ) : (
                <span className="text-texto-suave">Frete <span className="text-texto">{formatMoeda(atual.frete)}</span></span>
              )}
              <span className="font-bold text-texto">Total {formatMoeda(subtotal + (editando ? Number.parseFloat(freteEdicao.replace(',', '.')) || 0 : atual.frete))}</span>
            </div>
          </div>

          {editando && (
            <div className={card}>
              <div className="mb-2.5 text-sm font-bold text-texto">Nota da edição (opcional)</div>
              <textarea
                className="w-full rounded-xl border border-borda p-2 text-sm"
                rows={2}
                placeholder="O que mudou e por quê..."
                value={notaEdicao}
                onChange={(e) => setNotaEdicao(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <button className={btnSecondary} onClick={() => setEditando(false)}>Cancelar</button>
                <button className={btnPrimary} onClick={salvarEdicao}>Salvar edição (cria nova versão)</button>
              </div>
            </div>
          )}

          {atual.status === 'em_aprovacao' && podeAprovar && (
            <div className={card}>
              <div className="mb-2.5 text-sm font-bold text-texto">Reprovar orçamento</div>
              <p className="mb-1.5 text-xs text-texto-suave">Comentário obrigatório para liberar a reprovação — marque acima os itens com problema.</p>
              <textarea
                className="w-full rounded-xl border border-borda p-2 text-sm"
                rows={3}
                placeholder="Explique o motivo da reprovação..."
                value={justificativa}
                onChange={(e) => {
                  setJustificativa(e.target.value);
                  setErro(null);
                }}
              />
              {erro && <p className="m-0 mt-1.5 text-xs text-erro">{erro}</p>}
              <button className={`${btnDanger} mt-3`} onClick={reprovar}>
                Reprovar com os pontos marcados
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3" style={{ minWidth: 220 }}>
          {emRascunho && podeEnviarParaAprovacao && (
            <div className={card}>
              <div className="mb-2 text-sm font-bold text-texto">Ações do comprador</div>
              <p className="mb-3 text-xs text-texto-suave">Ajuste os itens à vontade. Ao enviar, o engenheiro é notificado e o orçamento trava para edição.</p>
              <button className={`${btnPrimary} w-full`} onClick={enviarParaAprovacao}>
                Enviar para aprovação do engenheiro
              </button>
            </div>
          )}

          {atual.status === 'em_aprovacao' && podeAprovar && (
            <div className={card}>
              <div className="mb-2 text-sm font-bold text-texto">Ações do engenheiro</div>
              <p className="mb-3 text-xs text-texto-suave">Visível só para o perfil Engenheiro ou Master</p>
              <button className={`${btnPrimary} w-full`} onClick={aprovar}>
                Aprovar orçamento
              </button>
            </div>
          )}

          {podeEditarAprovado && (
            <div className={card}>
              <div className="mb-2 text-sm font-bold text-texto">Ações do engenheiro</div>
              <p className="mb-3 text-xs text-texto-suave">Edita um orçamento já aprovado. A alteração vira uma nova versão no histórico.</p>
              <button className={`${btnPrimary} w-full`} onClick={iniciarEdicao}>
                Editar orçamento
              </button>
            </div>
          )}

          {atual.status === 'aprovado' && (
            <div className={card}>
              <div className="mb-2 text-sm font-bold text-texto">Orçamento do cliente</div>
              <p className="mb-3 text-xs text-texto-suave">Comparativo por fornecedor e resumo final, prontos para baixar como PDF.</p>
              <Link to={`/orcamento/${orcamento.id}/pdf`} className={`${btnSoft} block text-center`}>
                Ver comparativo / PDF
              </Link>
            </div>
          )}

          {recebimento && (
            <div className={card}>
              <div className="mb-2 text-sm font-bold text-texto">Recebimento em obra</div>
              <p className="mb-3 text-xs text-texto-suave">{RECEBIMENTO_TEXTO[recebimento]}</p>
              <Link to={`/orcamento/${orcamento.id}/recebimento`} className={`${btnSoft} block text-center`}>
                {orcamento.recebimentos.length > 0 ? 'Ver recebimento' : 'Registrar recebimento'}
              </Link>
            </div>
          )}

          <HistoricoOrcamento orcamento={orcamento} />
        </div>
      </div>
    </AppShell>
  );
}
