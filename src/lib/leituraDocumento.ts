/**
 * DMC:    VIZ-80-00-00-500B
 * Título: Integrações externas › Cliente da leitura de documentos
 * BREX:   VIZ-00-00-00-022A
 *
 * Chama o endpoint `/api/ler-documento` (ver server/routes/leituraIA.ts),
 * que esconde a chave do Gemini. Pré-condição: `arquivo` tem conteúdo
 * (nunca chamar com um File vazio). Lança erro — quem chama decide
 * como mostrar na tela.
 *
 * O Gemini às vezes devolve número como texto (ex.: "28,50" em vez de
 * 28.5), mesmo pedindo número no prompt — `normalizarX` blinda isso:
 * nunca confia no tipo que veio, sempre converte explicitamente antes
 * de devolver pra tela. Sem essa blindagem, um `.toFixed()` num texto
 * quebra silenciosamente e a tela de importação fica com itens vazios.
 */
export interface ItemLidoRequisicao {
  readonly descricao: string;
  readonly quantidade: string;
  readonly unidade: string;
}

export interface LeituraRequisicao {
  readonly itens: readonly ItemLidoRequisicao[];
}

export interface ItemLidoCotacao {
  readonly descricao: string;
  readonly quantidade: number;
  readonly precoUnitario: number;
}

export interface LeituraCotacao {
  readonly fornecedor?: { readonly nome?: string; readonly telefone?: string; readonly email?: string };
  readonly frete?: number;
  readonly itens: readonly ItemLidoCotacao[];
}

/** Converte number | string | undefined em número, aceitando "28,50", "R$ 28,50" etc. */
export function paraNumeroSeguro(valor: unknown): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor !== 'string') return 0;
  const limpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
  const numero = Number.parseFloat(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

function paraTextoSeguro(valor: unknown): string {
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number') return String(valor);
  return '';
}

function normalizarRequisicao(bruto: unknown): LeituraRequisicao {
  const itensBrutos = Array.isArray((bruto as { itens?: unknown[] })?.itens) ? (bruto as { itens: unknown[] }).itens : [];
  return {
    itens: itensBrutos.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        descricao: paraTextoSeguro(i.descricao),
        quantidade: paraTextoSeguro(i.quantidade),
        unidade: paraTextoSeguro(i.unidade),
      };
    }),
  };
}

function normalizarCotacao(bruto: unknown): LeituraCotacao {
  const b = bruto as Record<string, unknown>;
  const itensBrutos = Array.isArray(b?.itens) ? (b.itens as unknown[]) : [];
  const fornecedorBruto = b?.fornecedor as Record<string, unknown> | undefined;
  return {
    fornecedor: fornecedorBruto
      ? {
          nome: paraTextoSeguro(fornecedorBruto.nome),
          telefone: paraTextoSeguro(fornecedorBruto.telefone),
          email: paraTextoSeguro(fornecedorBruto.email),
        }
      : undefined,
    frete: paraNumeroSeguro(b?.frete),
    itens: itensBrutos.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        descricao: paraTextoSeguro(i.descricao),
        quantidade: paraNumeroSeguro(i.quantidade),
        precoUnitario: paraNumeroSeguro(i.precoUnitario),
      };
    }),
  };
}

function paraBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result as string;
      resolve(resultado.slice(resultado.indexOf(',') + 1));
    };
    leitor.onerror = () => reject(leitor.error ?? new Error('Falha ao ler o arquivo'));
    leitor.readAsDataURL(arquivo);
  });
}

async function chamarLeitura(arquivo: File, tipo: 'requisicao' | 'cotacao'): Promise<unknown> {
  const dataBase64 = await paraBase64(arquivo);
  const resposta = await fetch('/api/ler-documento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mimeType: arquivo.type || 'application/octet-stream', dataBase64, tipo }),
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json.erro ?? 'Falha na leitura do documento');
  }
  return json;
}

export async function lerRequisicao(arquivo: File): Promise<LeituraRequisicao> {
  return normalizarRequisicao(await chamarLeitura(arquivo, 'requisicao'));
}

export async function lerCotacao(arquivo: File): Promise<LeituraCotacao> {
  return normalizarCotacao(await chamarLeitura(arquivo, 'cotacao'));
}
