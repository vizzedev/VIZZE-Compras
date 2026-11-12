/**
 * DMC:    VIZ-30-30-00-200A
 * Título: Requisição e cotação › Comparativo › Lógica
 * BREX:   VIZ-00-00-00-022A
 *
 * Pré-condição: funciona com zero cotações (devolve lista vazia) — a
 * tela trata o estado vazio separadamente.
 * Invariante: cada item retornado aponta para o fornecedor com o menor
 * `subtotal` entre todas as cotações importadas para aquela descrição.
 */
import type { CotacaoImportada } from '@/lib/mockData';

export interface LinhaComparativo {
  readonly item: string;
  readonly quantidade: number;
  readonly porFornecedor: ReadonlyMap<string, number>;
  readonly fornecedorSugerido: string;
}

export function montarComparativo(cotacoes: readonly CotacaoImportada[]): readonly LinhaComparativo[] {
  const nomesItens = Array.from(new Set(cotacoes.flatMap((c) => c.itens.map((i) => i.item))));

  return nomesItens.map((nomeItem) => {
    const porFornecedor = new Map<string, number>();
    let quantidade = 0;
    let menorPreco = Number.POSITIVE_INFINITY;
    let fornecedorSugerido = '';

    for (const cotacao of cotacoes) {
      const item = cotacao.itens.find((i) => i.item === nomeItem);
      if (!item) continue;
      porFornecedor.set(cotacao.fornecedorNome, item.subtotal);
      quantidade = item.quantidade;
      if (item.subtotal < menorPreco) {
        menorPreco = item.subtotal;
        fornecedorSugerido = cotacao.fornecedorNome;
      }
    }

    return { item: nomeItem, quantidade, porFornecedor, fornecedorSugerido };
  });
}

export function totalPorFornecedor(cotacoes: readonly CotacaoImportada[]): ReadonlyMap<string, number> {
  const totais = new Map<string, number>();
  for (const cotacao of cotacoes) {
    const subtotalItens = cotacao.itens.reduce((soma, item) => soma + item.subtotal, 0);
    totais.set(cotacao.fornecedorNome, subtotalItens + cotacao.frete);
  }
  return totais;
}

export function totalSugerido(linhas: readonly LinhaComparativo[]): number {
  return linhas.reduce((soma, linha) => soma + (linha.porFornecedor.get(linha.fornecedorSugerido) ?? 0), 0);
}

/**
 * Mesmo total, mas respeitando a escolha manual do comprador por item
 * (`escolhas`), quando houver — cai no sugerido quando o item não foi
 * tocado.
 */
export function totalComEscolhas(linhas: readonly LinhaComparativo[], escolhas: ReadonlyMap<string, string>): number {
  return linhas.reduce((soma, linha) => {
    const fornecedor = escolhas.get(linha.item) ?? linha.fornecedorSugerido;
    return soma + (linha.porFornecedor.get(fornecedor) ?? 0);
  }, 0);
}
