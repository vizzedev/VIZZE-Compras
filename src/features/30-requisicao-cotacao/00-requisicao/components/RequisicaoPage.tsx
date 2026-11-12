/**
 * DMC:    VIZ-30-00-00-400A
 * Título: Requisição e cotação › Requisição
 * BREX:   VIZ-00-00-00-022A
 *
 * O orçamento (`:orcamentoId`) já existe desde o clique em "+ Novo
 * orçamento" — aqui só se preenche a obra e os itens, que ficam
 * guardados no próprio orçamento (não em `location.state`), para dar
 * pra voltar aqui depois de já ter avançado (mapa de cotação,
 * comparativo...) e editar de novo sem perder nada. "Revisar itens"
 * sempre reabre a edição, mesmo depois de enviado aos fornecedores.
 * Quatro formas de montar, que podem se combinar: anexar um documento,
 * tirar uma foto da lista escrita à mão, gravar um áudio falando os
 * itens (a IA — Gemini, via src/lib/leituraDocumento.ts — lê ou
 * transcreve, tanto faz), ou preencher manualmente. Gravação de áudio
 * depende de `navigator.mediaDevices` (precisa de HTTPS ou localhost
 * e permissão do navegador) — sem suporte, o botão mostra um aviso em
 * vez de quebrar a tela. O seletor de obra só mostra as obras do
 * Encarregado (`obrasPermitidas`); se o orçamento já tiver uma obra
 * fora dessa lista (link direto, por exemplo), ele é mandado embora
 * (`podeVerObra`) — mesma regra de OrcamentosPage/ObrasPage.
 *
 * Remover um item que já estava salvo na requisição (reaberta por
 * "Revisar itens", já enviada aos fornecedores ou não) exige
 * justificativa e vira um `EventoHistorico` no orçamento — é uma
 * mudança real, pode ter acontecido depois de cotado ou até aprovado
 * (ex.: item saiu de linha). Remover um item que nunca foi salvo (só
 * existe neste rascunho ainda não validado) é edição normal de
 * formulário, sem justificativa — nada foi comprometido ainda.
 */
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { EtapasPipeline } from '@/components/ui/EtapasPipeline';
import { CarregandoPagina } from '@/components/ui/CarregandoPagina';
import { ModalJustificativa } from '@/components/ui/ModalJustificativa';
import { card, input, label, btnPrimary, btnSecondary } from '@/components/ui/styles';
import { MontarComIA } from './MontarComIA';
import { TabelaItensRequisicao } from './TabelaItensRequisicao';
import { agora, avancarEtapa, obrasStore, orcamentosStore, obterCodigoCotacao, registrarEventoHistorico } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { lerRequisicao } from '@/lib/leituraDocumento';
import { gerarId } from '@/lib/id';
import { obrasPermitidas, podeVerObra, useSessao } from '@/lib/auth';

interface ItemRequisicaoForm {
  readonly id: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  readonly sugerido: boolean;
}

function novoId() {
  return gerarId();
}

function itemVazio(): ItemRequisicaoForm {
  return { id: novoId(), descricao: '', quantidade: '', unidade: '', sugerido: false };
}

export function RequisicaoPage() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  const sessao = useSessao();
  const obras = obrasPermitidas(sessao, useLista(obrasStore));
  useLista(orcamentosStore);
  const orcamento = orcamentoId ? orcamentosStore.obter(orcamentoId) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pedacosAudioRef = useRef<Blob[]>([]);

  const [itens, setItens] = useState<ItemRequisicaoForm[]>(() =>
    orcamento && orcamento.itensRequisicao.length > 0
      ? orcamento.itensRequisicao.map((item) => ({ ...item, id: novoId(), sugerido: false }))
      : [itemVazio()],
  );
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const [obraId, setObraId] = useState(orcamento?.obraId ?? '');
  const [erroObra, setErroObra] = useState(false);
  const [erroItens, setErroItens] = useState(false);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [validado, setValidado] = useState(orcamento?.requisicaoValidada ?? false);
  const [gravando, setGravando] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemRequisicaoForm | null>(null);
  const [justificativaExclusao, setJustificativaExclusao] = useState('');
  const [erroJustificativa, setErroJustificativa] = useState(false);

  // Cache local começa vazio (ver src/lib/store.ts) — se a página abriu
  // direto (link/F5) antes da primeira resposta de /api/orcamentos
  // chegar, `orcamento` nasce `undefined` e os estados acima (derivados
  // dele) ficam com o valor vazio padrão; este efeito os preenche assim
  // que o orçamento real aparecer, sem precisar remontar o componente.
  const jaSincronizou = useRef(false);
  useEffect(() => {
    if (!orcamento || jaSincronizou.current) return;
    jaSincronizou.current = true;
    if (orcamento.itensRequisicao.length > 0) {
      setItens(orcamento.itensRequisicao.map((item) => ({ ...item, id: novoId(), sugerido: false })));
    }
    setObraId(orcamento.obraId);
    setValidado(orcamento.requisicaoValidada);
  }, [orcamento]);

  if (!orcamento && orcamentosStore.carregando()) return <CarregandoPagina />;
  if (!orcamento || (orcamento.obraId && !podeVerObra(sessao, orcamento.obraId))) {
    return <Navigate to="/obras" replace />;
  }

  const obra = obras.find((item) => item.id === obraId);

  async function processarArquivo(file: File, nomeExibido: string) {
    setArquivo(nomeExibido);
    setLendo(true);
    setErroLeitura(null);
    try {
      const leitura = await lerRequisicao(file);
      if (leitura.itens.length === 0) {
        setErroLeitura('A IA não encontrou itens — confira o arquivo/áudio ou preencha manualmente.');
      } else {
        setItens(leitura.itens.map((item) => ({ ...item, id: novoId(), sugerido: true })));
      }
    } catch (erro) {
      setErroLeitura(erro instanceof Error ? erro.message : 'Falha ao ler a requisição.');
    } finally {
      setLendo(false);
    }
  }

  function handleAnexar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processarArquivo(file, file.name);
  }

  function handleFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processarArquivo(file, `foto (${file.name})`);
  }

  async function alternarGravacao() {
    if (gravando) {
      mediaRecorderRef.current?.stop();
      setGravando(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErroLeitura('Este navegador não dá acesso ao microfone — tente anexar um documento ou preencher manualmente.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const gravador = new MediaRecorder(stream);
      pedacosAudioRef.current = [];
      gravador.ondataavailable = (evento) => pedacosAudioRef.current.push(evento.data);
      gravador.onstop = () => {
        stream.getTracks().forEach((faixa) => faixa.stop());
        const blob = new Blob(pedacosAudioRef.current, { type: 'audio/webm' });
        void processarArquivo(new File([blob], 'requisicao-audio.webm', { type: 'audio/webm' }), 'áudio gravado');
      };
      gravador.start();
      mediaRecorderRef.current = gravador;
      setGravando(true);
      setErroLeitura(null);
    } catch {
      setErroLeitura('Não foi possível acessar o microfone — confira a permissão do navegador.');
    }
  }

  function atualizarItem(id: string, campo: 'descricao' | 'quantidade' | 'unidade', valor: string) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  function itemJaEstavaSalvo(item: ItemRequisicaoForm): boolean {
    return orcamento!.requisicaoValidada && orcamento!.itensRequisicao.some((i) => i.descricao === item.descricao);
  }

  function removerItem(id: string) {
    const item = itens.find((i) => i.id === id);
    if (!item) return;
    if (itemJaEstavaSalvo(item)) {
      setItemParaExcluir(item);
      setJustificativaExclusao('');
      setErroJustificativa(false);
      return;
    }
    setItens((atual) => atual.filter((i) => i.id !== id));
  }

  function confirmarExclusaoComJustificativa() {
    if (!justificativaExclusao.trim()) {
      setErroJustificativa(true);
      return;
    }
    registrarEventoHistorico(orcamento!, {
      tipo: 'item_removido',
      descricao: `Item "${itemParaExcluir!.descricao}" removido da requisição`,
      justificativa: justificativaExclusao.trim(),
      autor: `${sessao?.nome ?? 'Comprador'} (${sessao?.perfil ?? 'Comprador'})`,
      registradoEm: agora(),
    });
    setItens((atual) => atual.filter((i) => i.id !== itemParaExcluir!.id));
    setItemParaExcluir(null);
  }

  /** Grava o que já foi preenchido, sem exigir obra nem itens completos — ao contrário de "Validar itens", que é a entrada formal pro fluxo de cotação. */
  function salvarRascunho() {
    const itensPreenchidos = itens.filter((item) => item.descricao.trim().length > 0);
    orcamentosStore.atualizar(orcamento!.id, {
      obraId,
      obraNome: obra?.nome ?? '',
      cliente: obra?.cliente ?? '',
      itensRequisicao: itensPreenchidos.map(({ descricao, quantidade, unidade }) => ({ descricao, quantidade, unidade })),
    });
    navigate('/obras');
  }

  function validarItens() {
    if (!obraId) {
      setErroObra(true);
      return;
    }
    const itensPreenchidos = itens.filter((item) => item.descricao.trim().length > 0);
    if (itensPreenchidos.length === 0) {
      setErroItens(true);
      return;
    }
    setErroItens(false);
    setItens(itensPreenchidos);
    setValidado(true);
    orcamentosStore.atualizar(orcamento!.id, {
      obraId,
      obraNome: obra?.nome ?? '',
      cliente: obra?.cliente ?? '',
      itensRequisicao: itensPreenchidos.map(({ descricao, quantidade, unidade }) => ({ descricao, quantidade, unidade })),
      requisicaoValidada: true,
    });
  }

  async function enviarParaFornecedores() {
    const codigo = orcamento!.codigoCotacao ?? (await obterCodigoCotacao(orcamento!.id));
    orcamentosStore.atualizar(orcamento!.id, {
      codigoCotacao: codigo,
      requisicaoEnviadaEm: orcamento!.requisicaoEnviadaEm ?? agora(),
      etapa: avancarEtapa(orcamento!.etapa, 'cotacao'),
    });
    navigate(`/requisicao/${orcamento!.id}/pdf`);
  }

  return (
    <AppShell active="obras" backTo="/obras" backLabel="Obras" title={`Requisição — Orçamento ${orcamento.codigo}`}>
      <EtapasPipeline orcamentoId={orcamento.id} etapaAlcancada={orcamento.etapa} atual="requisicao" />

      <div className={`${card} max-w-[360px]`}>
        <label className={label} htmlFor="obra">Obra</label>
        <select
          id="obra"
          className={input}
          value={obraId}
          disabled={validado}
          onChange={(e) => {
            setObraId(e.target.value);
            setErroObra(false);
          }}
        >
          <option value="">Selecione a obra</option>
          {obras.map((item) => (
            <option key={item.id} value={item.id}>{item.nome}</option>
          ))}
        </select>
        {erroObra && <p className="m-0 mt-1.5 text-xs text-erro">Escolha a obra antes de continuar.</p>}
      </div>

      {!validado && (
        <MontarComIA
          fileInputRef={fileInputRef}
          fotoInputRef={fotoInputRef}
          onAnexar={handleAnexar}
          onFoto={handleFoto}
          onAlternarGravacao={alternarGravacao}
          gravando={gravando}
          arquivo={arquivo}
          lendo={lendo}
          erroLeitura={erroLeitura}
        />
      )}

      <TabelaItensRequisicao
        itens={itens}
        validado={validado}
        erroItens={erroItens}
        preenchidoPorIA={Boolean(arquivo) && !lendo && !validado}
        onAtualizarItem={atualizarItem}
        onRemoverItem={removerItem}
        onAdicionarItem={() => setItens((atual) => [...atual, itemVazio()])}
      />

      {!validado ? (
        <div className="flex justify-end gap-2">
          <button className={btnSecondary} onClick={salvarRascunho}>Salvar rascunho</button>
          <button className={btnPrimary} onClick={validarItens}>Validar itens</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-primaria-fundo p-4">
          <div className="text-sm text-primaria">
            {orcamento.requisicaoEnviadaEm ? 'Requisição já enviada aos fornecedores — pode ajustar e reenviar.' : 'Requisição validada — pronta para enviar aos fornecedores.'}
          </div>
          <div className="flex gap-2">
            <button className={btnSecondary} onClick={() => setValidado(false)}>Revisar itens</button>
            <button className={btnPrimary} onClick={enviarParaFornecedores}>
              {orcamento.requisicaoEnviadaEm ? 'Reenviar para fornecedores' : 'Enviar para fornecedores'}
            </button>
          </div>
        </div>
      )}

      {itemParaExcluir && (
        <ModalJustificativa
          titulo={`Remover "${itemParaExcluir.descricao}"?`}
          descricao="Esse item já fazia parte da requisição salva — explique por que está sendo removido (ex.: fornecedor parou de fabricar). Isso fica registrado no histórico do orçamento."
          valor={justificativaExclusao}
          onValorChange={(v) => {
            setJustificativaExclusao(v);
            setErroJustificativa(false);
          }}
          erro={erroJustificativa ? 'Explique o motivo da remoção antes de confirmar.' : undefined}
          onCancelar={() => setItemParaExcluir(null)}
          onConfirmar={confirmarExclusaoComJustificativa}
          textoConfirmar="Remover item"
        />
      )}
    </AppShell>
  );
}
