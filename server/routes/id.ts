/**
 * DMC:    VIZ-00-00-00-500C
 * Título: Núcleo › API › Geração de id no servidor
 * BREX:   VIZ-00-00-00-022A
 *
 * Node sempre roda em contexto seguro — sem o fallback que
 * `src/lib/id.ts` precisa pro navegador em HTTP puro (ver docs/decisoes.md).
 */
import { randomUUID } from 'node:crypto';

export function gerarId(): string {
  return randomUUID();
}
