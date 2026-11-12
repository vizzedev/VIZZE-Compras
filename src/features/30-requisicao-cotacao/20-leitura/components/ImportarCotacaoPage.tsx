/**
 * DMC:    VIZ-30-20-00-400A
 * Título: Requisição e cotação › Importar cotação do fornecedor
 * BREX:   VIZ-00-00-00-022A
 *
 * O fornecedor só é identificado AGORA, ao importar a resposta — não
 * antes. Comprador escolhe um fornecedor já cadastrado, cria um novo
 * aqui mesmo, ou edita os dados do escolhido antes de salvar. Com
 * `:cotacaoId` na rota, reabre uma importação já salva para revisão.
 */
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, input, label, btnPrimary, btnSecondary, pill, formatMoeda } from '@/components/ui/styles';
import { cotacoesImportadasStore, fornecedoresStore, type Fornecedor } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { lerCotacao } from '@/lib/leituraDocumento';
import { gerarId } from '@/lib/id';

interface ItemImportado {
  readonly id: string;
  descricao: string;
  quantidade: string;
  precoUnitario: string;
}

const FORNECEDOR_VAZIO = { nome: '', cnpj: '', telefone: '', email: '', formaPagamento: 'PIX' as Fornecedor['formaPagamento'], chavePix: '' };

function novoId() {
  return gerarId();
}

function paraNumero(valor: string): number {
  const limpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
  const numero = Number.parseFloat(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

export function ImportarCotacaoPage() {
  const navigate = useNavigate();
  const { orcamentoId, cotacaoId } = useParams();
  const voltarParaMapa = () => navigate(`/mapas-cotacao/${orcamentoId}`);
  const cotacaoExistente = cotacaoId ? cotacoesImportadasStore.obter(cotacaoId) : undefined;
  const fornecedores = useLista(fornecedoresStore);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<string | null>(cotacaoExistente?.arquivo ?? null);
  const [lendo, setLendo] = useState(false);
  const [itens, setItens] = useState<ItemImportado[]>(
    cotacaoExistente
      ? cotacaoExistente.itens.map((item) => ({ id: novoId(), descricao: item.item, quantidade: String(item.quantidade), precoUnitario: item.precoUnitario.toFixed(2).replace('.', ',') }))
      : [],
  );
  const [frete, setFrete] = useState(cotacaoExistente ? String(cotacaoExistente.frete) : '0');
  const [fornecedorId, setFornecedorId] = useState(cotacaoExistente?.fornecedorId ?? '');
  const [fornecedorDados, setFornecedorDados] = useState(() => {
    const existente = cotacaoExistente ? fornecedoresStore.obter(cotacaoExistente.fornecedorId) : undefined;
    return existente ?? FORNECEDOR_VAZIO;
  });
  const [erro, setErro] = useState<string | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  const total = itens.reduce((soma, item) => soma + paraNumero(item.quantidade) * paraNumero(item.precoUnitario), 0) + paraNumero(frete);

  async function handleAnexar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setArquivo(file.name);
    setLendo(true);
    setErroLeitura(null);
    try {
      const leitura = await lerCotacao(file);
      if (leitura.itens.length === 0) {
        setErroLeitura('A IA não encontrou itens nesse documento — confira o arquivo ou preencha manualmente.');
      } else {
        setItens(
          leitura.itens.map((item) => ({
            id: novoId(),
            descricao: item.descricao,
            quantidade: String(item.quantidade),
            precoUnitario: item.precoUnitario.toFixed(2).replace('.', ','),
          })),
        );
      }
      if (leitura.frete !== undefined) setFrete(String(leitura.frete));
      if (leitura.fornecedor?.nome && fornecedorId === 'novo') {
        setFornecedorDados((d) => ({
          ...d,
          nome: leitura.fornecedor?.nome ?? d.nome,
          telefone: leitura.fornecedor?.telefone ?? d.telefone,
          email: leitura.fornecedor?.email ?? d.email,
        }));
      }
    } catch (erro) {
      setErroLeitura(erro instanceof Error ? erro.message : 'Falha ao ler o documento.');
    } finally {
      setLendo(false);
    }
  }

  function selecionarFornecedor(valor: string) {
    setFornecedorId(valor);
    setErro(null);
    if (valor === 'novo') {
      setFornecedorDados(FORNECEDOR_VAZIO);
      return;
    }
    const existente = fornecedoresStore.obter(valor);
    if (existente) setFornecedorDados(existente);
  }

  function atualizarItem(id: string, campo: 'descricao' | 'quantidade' | 'precoUnitario', valor: string) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  function salvar() {
    if (!fornecedorDados.nome.trim()) {
      setErro('Identifique o fornecedor — escolha um já cadastrado ou preencha o nome do novo.');
      return;
    }
    if (itens.length === 0) {
      setErro('Anexe um documento ou adicione pelo menos um item.');
      return;
    }

    const fornecedor =
      fornecedorId && fornecedorId !== 'novo'
        ? (fornecedoresStore.atualizar(fornecedorId, fornecedorDados), fornecedoresStore.obter(fornecedorId)!)
        : fornecedoresStore.adicionar(fornecedorDados);

    const dadosCotacao = {
      orcamentoId: orcamentoId ?? '',
      fornecedorId: fornecedor.id,
      fornecedorNome: fornecedor.nome,
      arquivo: arquivo ?? 'preenchido manualmente',
      frete: paraNumero(frete),
      itens: itens.map((item) => ({
        item: item.descricao,
        quantidade: paraNumero(item.quantidade),
        precoUnitario: paraNumero(item.precoUnitario),
        subtotal: paraNumero(item.quantidade) * paraNumero(item.precoUnitario),
      })),
    };

    if (cotacaoExistente) {
      cotacoesImportadasStore.atualizar(cotacaoExistente.id, dadosCotacao);
    } else {
      cotacoesImportadasStore.adicionar(dadosCotacao);
    }
    voltarParaMapa();
  }

  return (
    <AppShell active="obras" backTo={`/mapas-cotacao/${orcamentoId}`} backLabel="Mapa de cotação" title={cotacaoExistente ? 'Revisar cotação importada' : 'Importar cotação'}>
      <div className="flex flex-wrap gap-5">
        <div className="flex flex-[2] flex-col gap-4" style={{ minWidth: 340 }}>
          <div className={card}>
            <div className="mb-2.5 text-sm font-bold text-texto">Documento do fornecedor</div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleAnexar} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center rounded-xl border border-dashed border-borda py-5 text-sm text-texto-suave"
            >
              {arquivo ? `Trocar documento (${arquivo})` : '+ Anexar documento (PDF, imagem, texto, planilha)'}
            </button>
            {lendo && <p className="mb-0 mt-2 text-xs text-texto-suave">Lendo documento com IA...</p>}
            {erroLeitura && <p className="mb-0 mt-2 text-xs text-erro">{erroLeitura}</p>}
          </div>

          <div className={card}>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-texto">Itens lidos — confirme ou corrija</span>
              {arquivo && !lendo && <span className={pill('primaria')}>sugerido pela leitura</span>}
            </div>
            {itens.length === 0 ? (
              <p className="m-0 text-xs text-texto-suave">Anexe um documento acima, ou adicione um item manualmente.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-xs text-texto-suave">
                    <th className="pb-2 text-left font-normal">Item</th>
                    <th className="pb-2 text-left font-normal">Qtd.</th>
                    <th className="pb-2 text-left font-normal">Preço unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 pr-2"><input className={input} value={item.descricao} onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)} /></td>
                      <td className="py-1.5 pr-2"><input className={input} value={item.quantidade} onChange={(e) => atualizarItem(item.id, 'quantidade', e.target.value)} /></td>
                      <td className="py-1.5"><input className={input} value={item.precoUnitario} onChange={(e) => atualizarItem(item.id, 'precoUnitario', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              className="mt-2 text-sm text-texto-suave"
              onClick={() => setItens((atual) => [...atual, { id: novoId(), descricao: '', quantidade: '', precoUnitario: '' }])}
            >
              + Adicionar item
            </button>
          </div>

          <div className={card}>
            <label className={label} htmlFor="frete">Frete</label>
            <input id="frete" className={`${input} max-w-[200px]`} value={frete} onChange={(e) => setFrete(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4" style={{ minWidth: 300 }}>
          <div className={card}>
            <div className="mb-2.5 text-sm font-bold text-texto">Fornecedor</div>
            <label className={label} htmlFor="fornecedor">Quem respondeu?</label>
            <select id="fornecedor" className={input} value={fornecedorId} onChange={(e) => selecionarFornecedor(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="novo">+ Novo fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>

            {fornecedorId && (
              <div className="mt-3 flex flex-col gap-2.5">
                <div>
                  <label className={label} htmlFor="fnome">Nome</label>
                  <input id="fnome" className={input} value={fornecedorDados.nome} onChange={(e) => setFornecedorDados((d) => ({ ...d, nome: e.target.value }))} />
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <label className={label} htmlFor="fcnpj">CNPJ</label>
                    <input id="fcnpj" className={input} value={fornecedorDados.cnpj} onChange={(e) => setFornecedorDados((d) => ({ ...d, cnpj: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className={label} htmlFor="ftelefone">Telefone</label>
                    <input id="ftelefone" className={input} value={fornecedorDados.telefone} onChange={(e) => setFornecedorDados((d) => ({ ...d, telefone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="femail">E-mail</label>
                  <input id="femail" className={input} value={fornecedorDados.email} onChange={(e) => setFornecedorDados((d) => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <label className={label} htmlFor="fforma">Forma de pagamento</label>
                    <select
                      id="fforma"
                      className={input}
                      value={fornecedorDados.formaPagamento}
                      onChange={(e) => setFornecedorDados((d) => ({ ...d, formaPagamento: e.target.value as Fornecedor['formaPagamento'] }))}
                    >
                      <option>PIX</option>
                      <option>Boleto</option>
                      <option>Transferência</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={label} htmlFor="fpix">Chave PIX</label>
                    <input id="fpix" className={input} value={fornecedorDados.chavePix} onChange={(e) => setFornecedorDados((d) => ({ ...d, chavePix: e.target.value }))} />
                  </div>
                </div>
                <p className="m-0 text-[11px] text-texto-suave">
                  {fornecedorId === 'novo' ? 'Cria este fornecedor ao salvar.' : 'Qualquer alteração aqui atualiza o cadastro do fornecedor.'}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-card bg-primaria-fundo p-4">
            <div className="text-xs text-primaria">Total desta cotação</div>
            <div className="text-xl font-bold text-primaria">{formatMoeda(total)}</div>
          </div>

          {erro && <p className="m-0 text-xs text-erro">{erro}</p>}

          <div className="flex gap-2">
            <button className={btnSecondary} onClick={voltarParaMapa}>Cancelar</button>
            <button className={btnPrimary} onClick={salvar}>Salvar importação</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
