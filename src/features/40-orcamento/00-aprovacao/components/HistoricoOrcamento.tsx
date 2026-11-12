/**
 * DMC:    VIZ-40-00-00-400B
 * Título: Orçamento › Histórico de versões e de alterações (sidebar)
 * BREX:   VIZ-00-00-00-022A
 */
import { card } from '@/components/ui/styles';
import type { Orcamento, VersaoOrcamento } from '@/lib/mockData';

const STATUS_TEXTO: Record<VersaoOrcamento['status'], string> = {
  rascunho: 'rascunho',
  em_aprovacao: 'em aprovação',
  aprovado: 'aprovado',
  reprovado: 'reprovado',
};

export function HistoricoOrcamento({ orcamento }: { orcamento: Orcamento }) {
  return (
    <>
      <div className={card}>
        <div className="mb-2 text-sm font-bold text-texto">Histórico de versões</div>
        {orcamento.versoes.map((v) => (
          <div key={v.versao} className="mb-2 text-xs last:mb-0">
            <div className="font-bold text-texto">
              Versão {v.versao} <span className="font-normal text-texto-suave">· {STATUS_TEXTO[v.status]}</span>
            </div>
            {v.editadoPor && <div className="text-texto-suave">Editado por {v.editadoPor}</div>}
            {v.notaEdicao && <div className="text-texto-suave">"{v.notaEdicao}"</div>}
            {!v.editadoPor && v.aprovadoPor && (
              <div className="text-texto-suave">
                {v.status === 'reprovado' ? 'Reprovado por' : 'Aprovado por'} {v.aprovadoPor}
              </div>
            )}
            {v.justificativa && <div className="text-texto-suave">"{v.justificativa}"</div>}
          </div>
        ))}
      </div>

      {orcamento.historico.length > 0 && (
        <div className={card}>
          <div className="mb-2 text-sm font-bold text-texto">Histórico de alterações</div>
          {[...orcamento.historico].reverse().map((e) => (
            <div key={e.id} className="mb-2.5 text-xs last:mb-0">
              <div className="font-bold text-texto">
                {e.descricao} <span className="font-normal text-texto-suave">· {e.autor}</span>
              </div>
              <div className="text-texto-suave">"{e.justificativa}"</div>
              <div className="text-texto-suave">{new Date(e.registradoEm).toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
