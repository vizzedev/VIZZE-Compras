/**
 * DMC:    VIZ-20-20-00-400A
 * Título: Cadastros base › Fornecedores › Lista
 * BREX:   VIZ-00-00-00-022A
 *
 * Fora do alcance do Encarregado — esse perfil só cria requisição e dá
 * recebimento de material, por isso a tela redireciona em vez de só
 * esconder o link no menu.
 */
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { cardRow, btnSoft } from '@/components/ui/styles';
import { fornecedoresStore } from '@/lib/mockData';
import { useLista } from '@/lib/store';
import { useSessao } from '@/lib/auth';

export function FornecedoresPage() {
  const sessao = useSessao();
  const fornecedores = useLista(fornecedoresStore);

  if (sessao?.perfil === 'Encarregado') {
    return <Navigate to="/obras" replace />;
  }

  return (
    <AppShell active="fornecedores" title="Fornecedores">
      <div className="flex flex-col gap-3">
        {fornecedores.map((fornecedor) => (
          <div key={fornecedor.id} className={cardRow}>
            <div>
              <div className="text-sm font-bold text-texto">{fornecedor.nome}</div>
              <div className="text-xs text-texto-suave">
                {fornecedor.telefone || 'sem telefone cadastrado'} · {fornecedor.email} · {fornecedor.formaPagamento}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to={`/fornecedores/${fornecedor.id}/editar`} className={btnSoft}>
                Editar
              </Link>
              <button className="text-xs text-texto-suave" onClick={() => fornecedoresStore.remover(fornecedor.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}

        <Link
          to="/fornecedores/novo"
          className="rounded-card border border-dashed border-borda bg-superficie p-4 text-center text-sm text-texto-suave no-underline"
        >
          + Cadastrar novo fornecedor
        </Link>
      </div>

      <p className="-mt-1 text-xs text-texto-suave">Engenheiro e Comprador podem cadastrar, editar e excluir fornecedores.</p>
    </AppShell>
  );
}
