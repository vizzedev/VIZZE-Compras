/**
 * DMC:    VIZ-00-00-00-300C
 * Título: Núcleo › Geração de id
 * BREX:   VIZ-00-00-00-022A
 *
 * `crypto.randomUUID()` só existe em contexto seguro (HTTPS ou
 * localhost) — em produção servida por HTTP puro (ex.: domínio sslip.io
 * sem certificado) ela não existe e quebra qualquer "criar" com um
 * TypeError silencioso. `crypto.getRandomValues()` não tem essa
 * exigência, então é a base do retrocesso aqui.
 */
export function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
