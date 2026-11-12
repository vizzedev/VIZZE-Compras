/**
 * DMC:    VIZ-30-00-00-400B
 * Título: Requisição e cotação › Requisição › Montar com IA (documento, foto, áudio)
 * BREX:   VIZ-00-00-00-022A
 *
 * Só a parte visual + os três gatilhos (anexar/foto/gravar) — a leitura
 * em si (`lerRequisicao`) e a gravação (`MediaRecorder`) continuam em
 * RequisicaoPage, que já tem o `orcamento`/`itens` para aplicar o
 * resultado.
 */
import type { RefObject } from 'react';
import { btnPrimary, btnSoft } from '@/components/ui/styles';

interface Props {
  fileInputRef: RefObject<HTMLInputElement>;
  fotoInputRef: RefObject<HTMLInputElement>;
  onAnexar: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFoto: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAlternarGravacao: () => void;
  gravando: boolean;
  arquivo: string | null;
  lendo: boolean;
  erroLeitura: string | null;
}

export function MontarComIA({ fileInputRef, fotoInputRef, onAnexar, onFoto, onAlternarGravacao, gravando, arquivo, lendo, erroLeitura }: Props) {
  return (
    <div className="rounded-card bg-superficie p-5 shadow-card">
      <div className="mb-2.5 text-sm font-bold text-texto">Montar com IA (opcional)</div>
      <p className="mb-3 mt-0 text-xs text-texto-suave">
        Anexe um documento, tire uma foto da lista escrita à mão ou grave um áudio falando os itens — a IA lê ou
        transcreve e sugere os itens abaixo, e você confirma ou corrige.
      </p>
      <input ref={fileInputRef} type="file" className="hidden" onChange={onAnexar} />
      <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFoto} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} className={`${btnSoft} flex-1`}>
          📄 Anexar documento
        </button>
        <button type="button" onClick={() => fotoInputRef.current?.click()} className={`${btnSoft} flex-1`}>
          📷 Tirar foto
        </button>
        <button type="button" onClick={onAlternarGravacao} className={`${gravando ? btnPrimary : btnSoft} flex-1`}>
          {gravando ? '⏹ Parar gravação' : '🎤 Gravar áudio'}
        </button>
      </div>
      {arquivo && <p className="mb-0 mt-2 text-xs text-texto-suave">Última entrada: {arquivo}</p>}
      {gravando && <p className="mb-0 mt-2 text-xs text-primaria">Gravando... fale os itens, a quantidade e a unidade, depois clique em "Parar gravação".</p>}
      {lendo && <p className="mb-0 mt-2 text-xs text-texto-suave">Lendo com IA...</p>}
      {erroLeitura && <p className="mb-0 mt-2 text-xs text-erro">{erroLeitura}</p>}
    </div>
  );
}
