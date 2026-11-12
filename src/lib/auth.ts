/**
 * DMC:    VIZ-10-00-00-300A
 * Título: Identidade e acesso › Sessão
 * BREX:   VIZ-00-00-00-022A
 *
 * Login de verdade agora: senha conferida no servidor contra o hash
 * (bcrypt — nunca texto puro, ver `server/auth.ts`), sessão real num
 * cookie `httpOnly` assinado (JWT) que o navegador não lê nem edita.
 * `sessionStorage` continua existindo só como CACHE de leitura
 * instantânea pra tela não "piscar" enquanto o cookie é validado — não
 * é mais a fonte da verdade: cada chamada à API confere o cookie de
 * novo, então uma sessão nele nunca é aceita só porque está no
 * `sessionStorage` do navegador.
 *
 * `obrasIds` só tem sentido pro Encarregado (as obras em que ele foi
 * cadastrado — ver `Usuario.obrasIds`); todo outro perfil enxerga
 * todas as obras, então fica `[]` sem uso. `podeVerObra`/`obrasPermitidas`
 * são o ponto único que decide isso — toda tela que lista/filtra por
 * obra usa um dos dois, em vez de reimplementar a regra.
 */
import { useSyncExternalStore } from 'react';

export interface Sessao {
  readonly nome: string;
  readonly perfil: 'Master' | 'Engenheiro' | 'Comprador' | 'Encarregado';
  readonly obrasIds: readonly string[];
}

export function podeVerObra(sessao: Sessao | null, obraId: string | undefined): boolean {
  if (sessao?.perfil !== 'Encarregado') return true;
  if (!obraId) return false;
  return sessao.obrasIds.includes(obraId);
}

export function obrasPermitidas<T extends { id: string }>(sessao: Sessao | null, obras: readonly T[]): readonly T[] {
  if (sessao?.perfil !== 'Encarregado') return obras;
  return obras.filter((obra) => sessao.obrasIds.includes(obra.id));
}

const CHAVE_SESSAO_CACHE = 'vizze-sessao-cache';

function lerCache(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO_CACHE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

function salvarCache(sessao: Sessao | null) {
  try {
    if (sessao) sessionStorage.setItem(CHAVE_SESSAO_CACHE, JSON.stringify(sessao));
    else sessionStorage.removeItem(CHAVE_SESSAO_CACHE);
  } catch {
    // sessionStorage indisponível (ex.: aba privada bloqueada) — segue só em memória.
  }
}

let sessaoAtual: Sessao | null = lerCache();
const listeners = new Set<() => void>();

function emitir() {
  for (const listener of listeners) listener();
}

/**
 * Chamado por `src/lib/store.ts` sempre que uma resposta da API vem
 * 401 — significa que o cookie de sessão não chegou ou não é mais
 * válido, mesmo que a tela ainda pareça "logado" (cache local
 * otimista). Sem isso, a falha fica muda: a tela continua mostrando
 * os dados que o usuário digitou (só na memória), e some tudo no
 * próximo recarregamento, porque nada foi gravado no banco de
 * verdade. Em vez disso, avisa e força um novo login.
 */
export function relatarSessaoInvalida(): void {
  if (sessaoAtual === null) return;
  sessaoAtual = null;
  salvarCache(null);
  emitir();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.alert(
      'Sua sessão expirou ou não está sendo reconhecida pelo servidor — o que você preencheu desde então NÃO foi salvo. Faça login de novo.',
    );
    window.location.href = '/login';
  }
}

async function conferirSessaoNoServidor() {
  try {
    const resposta = await fetch('/api/sessao', { credentials: 'include' });
    const sessao = (await resposta.json()) as Sessao | null;
    sessaoAtual = sessao;
    salvarCache(sessao);
    emitir();
  } catch {
    // sem rede — mantém o que já estava no cache até a próxima checagem.
  }
}
void conferirSessaoNoServidor();

export const authStore = {
  sessao(): Sessao | null {
    return sessaoAtual;
  },
  async entrar(usuario: string, senha: string): Promise<Sessao | null> {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ usuario, senha }),
    });
    if (!resposta.ok) return null;
    const sessao = (await resposta.json()) as Sessao;
    sessaoAtual = sessao;
    salvarCache(sessao);
    emitir();
    return sessao;
  },
  async sair(): Promise<void> {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    sessaoAtual = null;
    salvarCache(null);
    emitir();
  },
  inscrever(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useSessao(): Sessao | null {
  return useSyncExternalStore(authStore.inscrever, authStore.sessao);
}
