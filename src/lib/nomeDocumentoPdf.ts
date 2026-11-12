/**
 * DMC:    VIZ-00-00-00-300C
 * Título: Núcleo › Nome do arquivo ao salvar um documento como PDF
 * BREX:   VIZ-00-00-00-022A
 *
 * O navegador usa `document.title` como nome sugerido ao "Salvar como
 * PDF" na caixa de impressão (ver PreviaPdfPage, RequisicaoPdfPage).
 * Padrão pedido pelo usuário: "obra - identificador - data".
 */
import { useEffect } from 'react';

export function dataHojePtBr(): string {
  return new Date().toLocaleDateString('pt-BR');
}

export function montarNomeDocumento(obraNome: string, identificador: string): string {
  const partes = [obraNome || 'Obra', identificador, dataHojePtBr()];
  return partes.join(' - ');
}

/** Define `document.title` enquanto a tela estiver aberta; restaura ao sair. */
export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
