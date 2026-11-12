/**
 * DMC:    VIZ-40-30-00-400A
 * Título: Orçamento › Recebimento em obra
 * BREX:   VIZ-00-00-00-022A
 *
 * O Encarregado (ou Master) tira foto da nota fiscal e marca quais
 * itens chegaram — pode ser o orçamento todo ou só parte. Entregas
 * parciais vão se somando (`statusRecebimento`, em mockData.ts) até
 * tudo ter chegado; nunca apaga uma entrega anterior, só acrescenta.
 * Quem não é Encarregado/Master só vê o histórico, sem registrar.
 * Encarregado só acessa o recebimento de uma obra em que foi
 * cadastrado (`podeVerObra`) — mesma regra das outras telas.
 */
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { card, btnPrimary, pill, formatMoeda } from '@/components/ui/styles';
import { agora, orcamentosStore, registrarRecebimento, statusRecebimento, versaoAtual } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { podeVerObra, useSessao } from '@/lib/auth';

const STATUS_TEXTO: Record<string, string> = {
  aprovado: 'Aguardando recebimento',
  recebimento_parcial: 'Recebimento parcial',
  recebido: 'Recebido por completo',
};

const STATUS_TONE: Record<string, 'neutral' | 'primaria' | 'alerta'> = {
  aprovado: 'neutral',
  recebimento_parcial: 'alerta',
  recebido: 'primaria',
};

export function RecebimentoPage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  const sessao = useSessao();
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [marcados, setMarcados] = useState<ReadonlySet<string>>(new Set());
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento || versaoAtual(orcamento)?.status !== 'aprovado' || !podeVerObra(sessao, orcamento.obraId)) {
    return <Navigate to="/orcamentos" replace />;
  }

  const podeReceber = sessao?.perfil === 'Encarregado' || sessao?.perfil === 'Master';
  const itens = versaoAtual(orcamento).itens;
  const itensJaRecebidos = new Set(orcamento.recebimentos.flatMap((r) => r.itensRecebidos));
  const status = statusRecebimento(orcamento);

  function alternarItem(nome: string) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(nome)) novo.delete(nome);
      else novo.add(nome);
      return novo;
    });
  }

  function handleAnexar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setArquivo(file.name);
      setErro(null);
    }
  }

  function registrar() {
    const itensDestaEntrega = itens.filter((item) => marcados.has(item.item) && !itensJaRecebidos.has(item.item)).map((item) => item.item);
    if (itensDestaEntrega.length === 0) {
      setErro('Marque pelo menos um item que chegou nesta entrega.');
      return;
    }
    if (!arquivo) {
      setErro('Anexe a foto da nota fiscal antes de registrar.');
      return;
    }
    const totalRecebidoAposEsta = new Set([...itensJaRecebidos, ...itensDestaEntrega]).size;
    registrarRecebimento(orcamento!, {
      tipo: totalRecebidoAposEsta >= itens.length ? 'completo' : 'parcial',
      itensRecebidos: itensDestaEntrega,
      fotoNotaFiscal: arquivo,
      recebidoPor: `${sessao?.nome ?? 'Encarregado'} (${sessao?.perfil ?? 'Encarregado'})`,
      recebidoEm: agora(),
      observacao: observacao.trim() || undefined,
    });
    navigate(`/orcamento/${orcamento!.id}`);
  }

  return (
    <AppShell active="orcamentos" backTo={`/orcamento/${orcamento.id}`} backLabel="Orçamento" title={`Recebimento — Orçamento ${orcamento.codigo}`}>
      <p className="-mt-3 text-xs text-texto-suave">Obra {orcamento.obraNome} · Cliente {orcamento.cliente}</p>
      <span className={pill(STATUS_TONE[status])}>{STATUS_TEXTO[status]}</span>

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
                  <th className="pb-2 text-left font-normal">Chegou nesta entrega?</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const jaRecebido = itensJaRecebidos.has(item.item);
                  return (
                    <tr key={item.item}>
                      <td className="py-1.5 pr-2 text-texto">{item.item}</td>
                      <td className="py-1.5 pr-2 text-texto-suave">{item.fornecedorEscolhido}</td>
                      <td className="py-1.5 pr-2 text-texto">{formatMoeda(item.porFornecedor[item.fornecedorEscolhido] ?? 0)}</td>
                      <td className="py-1.5">
                        {jaRecebido ? (
                          <span className={pill('primaria')}>já recebido</span>
                        ) : podeReceber ? (
                          <label className="flex items-center gap-1.5 text-xs text-texto-suave">
                            <input type="checkbox" checked={marcados.has(item.item)} onChange={() => alternarItem(item.item)} />
                            chegou
                          </label>
                        ) : (
                          <span className={pill('alerta')}>pendente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {podeReceber && status !== 'recebido' && (
            <div className={card}>
              <div className="mb-2.5 text-sm font-bold text-texto">Foto da nota fiscal</div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAnexar} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center rounded-xl border border-dashed border-borda py-5 text-sm text-texto-suave"
              >
                {arquivo ? `Foto anexada (${arquivo})` : '📷 Tirar foto da nota fiscal'}
              </button>

              <div className="mt-3">
                <div className="mb-1 text-xs text-texto-suave">Observação (opcional)</div>
                <textarea
                  className="w-full rounded-xl border border-borda p-2 text-sm"
                  rows={2}
                  placeholder="Algum item com avaria, atraso do restante..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
              {erro && <p className="m-0 mt-1.5 text-xs text-erro">{erro}</p>}
              <button className={`${btnPrimary} mt-3`} onClick={registrar}>
                Registrar recebimento
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3" style={{ minWidth: 220 }}>
          <div className={card}>
            <div className="mb-2 text-sm font-bold text-texto">Histórico de entregas</div>
            {orcamento.recebimentos.length === 0 ? (
              <p className="m-0 text-xs text-texto-suave">Nenhuma entrega registrada ainda.</p>
            ) : (
              orcamento.recebimentos.map((r) => (
                <div key={r.id} className="mb-2.5 text-xs last:mb-0">
                  <div className="font-bold text-texto">
                    {r.tipo === 'completo' ? 'Entrega completa' : 'Entrega parcial'} <span className="font-normal text-texto-suave">· {r.recebidoPor}</span>
                  </div>
                  <div className="text-texto-suave">{r.itensRecebidos.join(', ')}</div>
                  <div className="text-texto-suave">Foto: {r.fotoNotaFiscal}</div>
                  {r.observacao && <div className="text-texto-suave">"{r.observacao}"</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
