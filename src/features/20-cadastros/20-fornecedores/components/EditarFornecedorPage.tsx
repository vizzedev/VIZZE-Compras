/**
 * DMC:    VIZ-20-20-10-400A
 * Título: Cadastros base › Fornecedores › Editar/criar (contato e pagamento)
 * BREX:   VIZ-00-00-00-022A
 */
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/ui/AppShell';
import { card, input, label, btnPrimary, btnSecondary, pill } from '@/components/ui/styles';
import { fornecedoresStore, type Fornecedor } from '@/lib/mockData';

export function EditarFornecedorPage() {
  const { fornecedorId } = useParams();
  const navigate = useNavigate();
  const fornecedor = fornecedorId ? fornecedoresStore.obter(fornecedorId) : undefined;

  const nomeRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const formaPagamentoRef = useRef<HTMLSelectElement>(null);
  const chavePixRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dados = {
      nome: nomeRef.current?.value ?? '',
      cnpj: cnpjRef.current?.value ?? '',
      telefone: telefoneRef.current?.value ?? '',
      email: emailRef.current?.value ?? '',
      formaPagamento: (formaPagamentoRef.current?.value ?? 'PIX') as Fornecedor['formaPagamento'],
      chavePix: chavePixRef.current?.value ?? '',
    };
    if (fornecedor) {
      fornecedoresStore.atualizar(fornecedor.id, dados);
    } else {
      fornecedoresStore.adicionar(dados);
    }
    navigate('/fornecedores');
  }

  return (
    <AppShell active="fornecedores" backTo="/fornecedores" backLabel="Fornecedores" title={fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}>
      <form onSubmit={handleSubmit} className={`${card} flex max-w-[560px] flex-col gap-3.5`}>
        {fornecedor && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-texto">Dados cadastrais</span>
            <span className={pill('primaria')}>preenchido pela leitura automática</span>
          </div>
        )}

        <div>
          <label className={label} htmlFor="nome">Nome</label>
          <input id="nome" ref={nomeRef} className={input} defaultValue={fornecedor?.nome ?? ''} />
        </div>
        <div className="flex gap-3.5">
          <div className="flex-1">
            <label className={label} htmlFor="cnpj">CNPJ</label>
            <input id="cnpj" ref={cnpjRef} className={input} defaultValue={fornecedor?.cnpj ?? ''} />
          </div>
          <div className="flex-1">
            <label className={label} htmlFor="telefone">Telefone</label>
            <input id="telefone" ref={telefoneRef} className={input} defaultValue={fornecedor?.telefone ?? ''} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="email">E-mail</label>
          <input id="email" ref={emailRef} className={input} defaultValue={fornecedor?.email ?? ''} />
        </div>
        <div className="flex gap-3.5">
          <div className="flex-1">
            <label className={label} htmlFor="formaPagamento">Forma de pagamento</label>
            <select id="formaPagamento" ref={formaPagamentoRef} className={input} defaultValue={fornecedor?.formaPagamento ?? 'PIX'}>
              <option>PIX</option>
              <option>Boleto</option>
              <option>Transferência</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={label} htmlFor="chavePix">Chave PIX</label>
            <input id="chavePix" ref={chavePixRef} className={input} defaultValue={fornecedor?.chavePix ?? ''} />
          </div>
        </div>
        <p className="m-0 text-xs text-texto-suave">
          Essas informações de pagamento ficam internas — não aparecem no orçamento enviado ao cliente.
        </p>

        <div className="mt-1 flex gap-2">
          <button type="button" onClick={() => navigate('/fornecedores')} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" className={btnPrimary}>
            Salvar alterações
          </button>
        </div>
      </form>
    </AppShell>
  );
}
