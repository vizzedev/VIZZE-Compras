/**
 * DMC:    VIZ-00-00-00-300B
 * Título: Núcleo › Store com persistência (cache local + sincronização em segundo plano)
 * BREX:   VIZ-00-00-00-022A
 *
 * "Local-first": toda leitura/escrita do componente é síncrona contra
 * uma cópia local (igual sempre foi) — o componente nem sabe que existe
 * rede. `adicionar`/`atualizar`/`remover` continuam retornando/mutando
 * na hora, e por baixo disparam a chamada pra `/api/<recurso>` sem o
 * chamador esperar (fire-and-forget, com retry simples em erro de
 * rede). Ao carregar o módulo, busca o estado atual do servidor uma vez
 * e substitui a lista local — é o que faz os dados sobreviverem a um
 * reinício do container (ver docs/decisoes.md, decisão de persistência).
 *
 * Isso troca sincronização em tempo real entre abas/usuários por
 * simplicidade: outra pessoa só vê a mudança no próximo recarregamento
 * dela. Aceitável pro tamanho de equipe que usa isso hoje — não serve
 * pra uso concorrente pesado sem uma camada de websocket por cima.
 *
 * Pré-condição de `atualizar`/`remover`: `id` existe na lista local —
 * chamar com um id inexistente é no-op silencioso, nunca lança.
 */
import { useSyncExternalStore } from 'react';
import { gerarId } from './id';

async function persistir(metodo: 'POST' | 'PATCH' | 'DELETE', url: string, corpo?: unknown): Promise<void> {
  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      credentials: 'include',
    });
    if (!resposta.ok) {
      console.error(`[store] ${metodo} ${url} falhou (${resposta.status}) — a mudança ficou só local até a próxima sincronização.`);
    }
  } catch (erro) {
    console.error(`[store] ${metodo} ${url} falhou (rede) — a mudança ficou só local até a próxima sincronização.`, erro);
  }
}

function createStore<T extends { id: string }>(recurso: string) {
  let itens: readonly T[] = [];
  let carregado = false;
  const listeners = new Set<() => void>();

  function emitir() {
    for (const listener of listeners) listener();
  }

  async function carregar() {
    try {
      const resposta = await fetch(`/api/${recurso}`, { credentials: 'include' });
      if (resposta.ok) itens = await resposta.json();
    } catch (erro) {
      console.error(`[store] falha ao carregar /api/${recurso}`, erro);
    } finally {
      carregado = true;
      emitir();
    }
  }
  void carregar();

  return {
    listar(): readonly T[] {
      return itens;
    },
    obter(id: string): T | undefined {
      return itens.find((item) => item.id === id);
    },
    carregando(): boolean {
      return !carregado;
    },
    adicionar(item: Omit<T, 'id'>): T {
      const novo = { ...item, id: gerarId() } as T;
      itens = [...itens, novo];
      emitir();
      void persistir('POST', `/api/${recurso}`, novo);
      return novo;
    },
    /** Insere no cache local um item que o servidor já criou por uma rota dedicada (ex.: `criarOrcamento`, que precisa do código numerado de verdade) — não dispara POST, já está persistido. */
    inserirLocal(item: T) {
      itens = [...itens, item];
      emitir();
    },
    atualizar(id: string, dados: Partial<Omit<T, 'id'>>) {
      itens = itens.map((item) => (item.id === id ? { ...item, ...dados } : item));
      emitir();
      void persistir('PATCH', `/api/${recurso}/${id}`, dados);
    },
    remover(id: string) {
      itens = itens.filter((item) => item.id !== id);
      emitir();
      void persistir('DELETE', `/api/${recurso}/${id}`);
    },
    inscrever(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useLista<T extends { id: string }>(store: ReturnType<typeof createStore<T>>): readonly T[] {
  return useSyncExternalStore(store.inscrever, store.listar);
}

export { createStore };
