/**
 * DMC:    VIZ-30-20-00-200A
 * Título: Requisição e cotação › Casar item lido pela IA com item da requisição
 * BREX:   VIZ-00-00-00-022A
 *
 * A IA lê a cotação do fornecedor com a grafia dele (ex.: "cimento cp
 * ii 50kg"), não necessariamente igual à descrição que o comprador
 * escreveu na requisição (ex.: "Cimento CP-II 50kg saco"). Sem casar
 * por similaridade, cada leitura criaria um item novo em vez de
 * preencher o preço do item já esperado — daí a tabela de cotações
 * virar uma bagunça de itens quase-duplicados. Limiar de 0.5 (metade
 * dos caracteres iguais, normalizado) é conservador: abaixo disso é
 * melhor manter a descrição lida (pode ser item genuinamente
 * diferente) do que casar errado.
 */
function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function distanciaLevenshtein(a: string, b: string): number {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const distancias: number[][] = Array.from({ length: linhas }, () => new Array<number>(colunas).fill(0));
  for (let i = 0; i < linhas; i++) distancias[i][0] = i;
  for (let j = 0; j < colunas; j++) distancias[0][j] = j;
  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      const custoSubstituicao = a[i - 1] === b[j - 1] ? 0 : 1;
      distancias[i][j] = Math.min(
        distancias[i - 1][j] + 1,
        distancias[i][j - 1] + 1,
        distancias[i - 1][j - 1] + custoSubstituicao,
      );
    }
  }
  return distancias[a.length][b.length];
}

const LIMIAR_SIMILARIDADE = 0.5;

/** Devolve a descrição da requisição mais parecida com `descricaoLida`, ou a própria `descricaoLida` se nenhuma passar do limiar. */
export function casarComItemRequisicao(descricaoLida: string, descricoesRequisicao: readonly string[]): string {
  if (descricoesRequisicao.length === 0) return descricaoLida;
  const alvo = normalizar(descricaoLida);
  let melhorDescricao = descricaoLida;
  let melhorSimilaridade = 0;
  for (const candidata of descricoesRequisicao) {
    const candidataNormalizada = normalizar(candidata);
    const tamanhoMaximo = Math.max(alvo.length, candidataNormalizada.length) || 1;
    const similaridade = 1 - distanciaLevenshtein(alvo, candidataNormalizada) / tamanhoMaximo;
    if (similaridade > melhorSimilaridade) {
      melhorSimilaridade = similaridade;
      melhorDescricao = candidata;
    }
  }
  return melhorSimilaridade >= LIMIAR_SIMILARIDADE ? melhorDescricao : descricaoLida;
}

export function mesmoItem(a: string, b: string): boolean {
  return normalizar(a) === normalizar(b);
}
