/**
 * DMC:    VIZ-00-00-00-400E
 * Título: Núcleo › Tela de carregamento inicial
 * BREX:   VIZ-00-00-00-022A
 *
 * Só aparece no instante entre abrir a página (direto por link/F5) e a
 * primeira resposta de `/api/<recurso>` chegar — sem isso, uma tela que
 * manda embora quando "o orçamento não existe" mandaria embora todo
 * mundo nesse instante, porque o cache local começa vazio (ver
 * `src/lib/store.ts`).
 */
export function CarregandoPagina() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fundo">
      <p className="text-sm text-texto-suave">Carregando…</p>
    </div>
  );
}
