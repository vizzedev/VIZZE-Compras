/**
 * DMC:    VIZ-20-00-10-400A
 * Título: Cadastros base › Obras › Editar/criar
 * BREX:   VIZ-00-00-00-022A
 */
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { obrasStore } from '@/lib/mockData';

export function EditarObraPage() {
  const { obraId } = useParams();
  const navigate = useNavigate();
  const obra = obraId ? obrasStore.obter(obraId) : undefined;

  const nomeRef = useRef<HTMLInputElement>(null);
  const clienteRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dados = {
      nome: nomeRef.current?.value ?? '',
      cliente: clienteRef.current?.value ?? '',
      endereco: enderecoRef.current?.value ?? '',
    };
    if (obra) {
      obrasStore.atualizar(obra.id, dados);
    } else {
      obrasStore.adicionar(dados);
    }
    navigate('/obras');
  }

  return (
    <AppShell active="obras" backTo="/obras" backLabel="Obras" title={obra ? 'Editar obra' : 'Nova obra'}>
      <form
        onSubmit={handleSubmit}
        className="flex max-w-[560px] flex-col gap-3.5 rounded-card bg-superficie p-5 shadow-card"
      >
        <div>
          <label className="mb-1 block text-xs text-texto-suave" htmlFor="nome">
            Nome da obra
          </label>
          <input id="nome" ref={nomeRef} className="w-full rounded-xl border border-borda px-2.5 py-2 text-sm" defaultValue={obra?.nome ?? ''} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-texto-suave" htmlFor="cliente">
            Cliente
          </label>
          <input id="cliente" ref={clienteRef} className="w-full rounded-xl border border-borda px-2.5 py-2 text-sm" defaultValue={obra?.cliente ?? ''} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-texto-suave" htmlFor="endereco">
            Endereço
          </label>
          <input id="endereco" ref={enderecoRef} className="w-full rounded-xl border border-borda px-2.5 py-2 text-sm" defaultValue={obra?.endereco ?? ''} />
        </div>

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => navigate('/obras')} className="rounded-full px-5 py-2 text-sm text-texto-suave">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-primaria px-5 py-2 text-sm font-medium text-white shadow-card">
            Salvar alterações
          </button>
        </div>
      </form>
    </AppShell>
  );
}
