/**
 * DMC:    VIZ-00-00-00-400C
 * Título: Núcleo › Classes do design system (botões pílula, cartões com sombra)
 * BREX:   VIZ-00-00-00-022A
 *
 * Centraliza as classes Tailwind repetidas entre telas, para a
 * identidade visual (botões em pílula, cartões com sombra suave em vez
 * de borda) mudar num só lugar.
 */
export const card = 'rounded-card bg-superficie p-5 shadow-card';
export const cardRow = 'flex flex-wrap items-center justify-between gap-2 rounded-card bg-superficie p-4 shadow-card';
export const input = 'w-full rounded-xl border border-borda px-2.5 py-2 text-sm';
export const label = 'mb-1 block text-xs text-texto-suave';

/**
 * Glassmorfismo: fundo translúcido + `backdrop-blur` + borda clara fina.
 * Preto/branco puros (não os tokens var()) porque o modificador de
 * opacidade do Tailwind (`/85`, `/10`...) não funciona sobre uma cor
 * definida por `var()` — só sobre cores literais do Tailwind.
 */
export const btnPrimary =
  'rounded-full border border-white/10 bg-black/85 px-5 py-2 text-sm font-bold text-white no-underline backdrop-blur-md shadow-lg shadow-black/20';
export const btnSecondary =
  'rounded-full border border-black/10 bg-white/50 px-5 py-2 text-sm font-medium text-texto no-underline backdrop-blur-md';
export const btnSoft =
  'rounded-full border border-black/10 bg-black/5 px-5 py-2 text-sm font-bold text-texto no-underline backdrop-blur-md';
export const btnDanger =
  'rounded-full border border-[#C0392B]/25 bg-white/50 px-5 py-2 text-sm font-bold text-erro no-underline backdrop-blur-md';

export function pill(tone: 'neutral' | 'primaria' | 'alerta' | 'erro' = 'neutral'): string {
  const tones: Record<string, string> = {
    neutral: 'bg-fundo text-texto-suave',
    primaria: 'bg-primaria-fundo text-primaria',
    alerta: 'bg-alerta-fundo text-alerta',
    erro: 'bg-erro-fundo text-erro',
  };
  return `inline-block rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`;
}

export function formatMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
