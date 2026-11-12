/**
 * DMC:    VIZ-30-00-00-400C
 * Título: Requisição e cotação › Requisição › Tabela de itens
 * BREX:   VIZ-00-00-00-022A
 *
 * `onRemoverItem` decide sozinha (em RequisicaoPage) se a remoção pode
 * sair direto ou precisa da justificativa primeiro — esta tabela só
 * chama e não sabe dessa distinção.
 */
import { card, input, pill } from '@/components/ui/styles';

interface ItemRequisicaoForm {
  readonly id: string;
  descricao: string;
  quantidade: string;
  unidade: string;
  readonly sugerido: boolean;
}

interface Props {
  itens: readonly ItemRequisicaoForm[];
  validado: boolean;
  erroItens: boolean;
  preenchidoPorIA: boolean;
  onAtualizarItem: (id: string, campo: 'descricao' | 'quantidade' | 'unidade', valor: string) => void;
  onRemoverItem: (id: string) => void;
  onAdicionarItem: () => void;
}

export function TabelaItensRequisicao({ itens, validado, erroItens, preenchidoPorIA, onAtualizarItem, onRemoverItem, onAdicionarItem }: Props) {
  return (
    <div className={card}>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-texto">Itens necessários</span>
        {preenchidoPorIA && <span className={pill('primaria')}>preenchido pela leitura automática</span>}
        {validado && <span className={pill('primaria')}>itens validados</span>}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-xs text-texto-suave">
            <th className="pb-2 text-left font-normal">Descrição</th>
            <th className="pb-2 text-left font-normal">Quantidade</th>
            <th className="pb-2 text-left font-normal">Unidade</th>
            <th className="pb-2" />
            {!validado && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td className="py-1.5 pr-2">
                <input disabled={validado} className={input} value={item.descricao} onChange={(e) => onAtualizarItem(item.id, 'descricao', e.target.value)} />
              </td>
              <td className="py-1.5 pr-2">
                <input disabled={validado} className={input} value={item.quantidade} onChange={(e) => onAtualizarItem(item.id, 'quantidade', e.target.value)} />
              </td>
              <td className="py-1.5 pr-2">
                <input disabled={validado} className={input} value={item.unidade} onChange={(e) => onAtualizarItem(item.id, 'unidade', e.target.value)} />
              </td>
              <td className="py-1.5 pr-2">{item.sugerido && <span className={pill('primaria')}>sugerido</span>}</td>
              {!validado && (
                <td className="py-1.5">
                  <button type="button" className="text-xs text-texto-suave" onClick={() => onRemoverItem(item.id)}>
                    remover
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!validado && (
        <button type="button" className="mt-2 text-sm text-texto-suave" onClick={onAdicionarItem}>
          + Adicionar item
        </button>
      )}
      {erroItens && <p className="m-0 mt-2 text-xs text-erro">Adicione pelo menos um item antes de validar.</p>}
    </div>
  );
}
