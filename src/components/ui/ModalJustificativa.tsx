/**
 * DMC:    VIZ-00-00-00-400D
 * Título: Núcleo › Modal de confirmação com justificativa obrigatória
 * BREX:   VIZ-00-00-00-022A
 *
 * Reutilizável em qualquer ação que precise de um motivo registrado
 * (hoje: remover item já salvo de uma requisição, em RequisicaoPage) —
 * o chamador decide o que fazer com a justificativa (ex.: gravar um
 * `EventoHistorico`), este componente só garante que ela não vem vazia.
 */
import { card, btnSecondary, btnDanger } from './styles';

interface Props {
  titulo: string;
  descricao: string;
  valor: string;
  onValorChange: (valor: string) => void;
  erro?: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  textoConfirmar?: string;
}

export function ModalJustificativa({ titulo, descricao, valor, onValorChange, erro, onCancelar, onConfirmar, textoConfirmar }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className={`${card} w-full max-w-[420px]`}>
        <p className="m-0 mb-1 text-sm font-bold text-texto">{titulo}</p>
        <p className="m-0 mb-3 text-xs text-texto-suave">{descricao}</p>
        <textarea
          className="w-full rounded-xl border border-borda p-2 text-sm"
          rows={3}
          placeholder="Justificativa"
          value={valor}
          onChange={(e) => onValorChange(e.target.value)}
        />
        {erro && <p className="m-0 mt-1.5 text-xs text-erro">{erro}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button className={btnSecondary} onClick={onCancelar}>Cancelar</button>
          <button className={btnDanger} onClick={onConfirmar}>{textoConfirmar ?? 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
