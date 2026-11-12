/**
 * DMC:    VIZ-00-00-00-400A
 * Título: Núcleo › Rotas da aplicação
 * BREX:   VIZ-00-00-00-022A
 *
 * MVP completo (navegação ponta a ponta com dados fictícios). Autenticação
 * real, Supabase e a IA de leitura entram quando as credenciais chegarem
 * — ver docs/DMRL.md.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/10-identidade/00-login/components/LoginPage';
import { UsuariosPage } from '@/features/10-identidade/20-usuarios/components/UsuariosPage';
import { NovoUsuarioPage } from '@/features/10-identidade/20-usuarios/components/NovoUsuarioPage';
import { EditarUsuarioPage } from '@/features/10-identidade/20-usuarios/components/EditarUsuarioPage';
import { ObrasPage } from '@/features/20-cadastros/00-obras/components/ObrasPage';
import { EditarObraPage } from '@/features/20-cadastros/00-obras/components/EditarObraPage';
import { FornecedoresPage } from '@/features/20-cadastros/20-fornecedores/components/FornecedoresPage';
import { EditarFornecedorPage } from '@/features/20-cadastros/20-fornecedores/components/EditarFornecedorPage';
import { RequisicaoPage } from '@/features/30-requisicao-cotacao/00-requisicao/components/RequisicaoPage';
import { RequisicaoPdfPage } from '@/features/30-requisicao-cotacao/00-requisicao/components/RequisicaoPdfPage';
import { MapaCotacaoPage } from '@/features/30-requisicao-cotacao/10-mapa-cotacao/components/MapaCotacaoPage';
import { ImportarCotacaoPage } from '@/features/30-requisicao-cotacao/20-leitura/components/ImportarCotacaoPage';
import { ComparativoPage } from '@/features/30-requisicao-cotacao/30-comparativo/components/ComparativoPage';
import { OrcamentoPage } from '@/features/40-orcamento/00-aprovacao/components/OrcamentoPage';
import { PreviaPdfPage } from '@/features/40-orcamento/10-pdf/components/PreviaPdfPage';
import { OrcamentosPage } from '@/features/40-orcamento/20-listagem/components/OrcamentosPage';
import { RecebimentoPage } from '@/features/40-orcamento/30-recebimento/components/RecebimentoPage';
import { PainelPage } from '@/features/90-painel/00-analitico/components/PainelPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/obras" element={<ObrasPage />} />
      <Route path="/obras/nova" element={<EditarObraPage />} />
      <Route path="/obras/:obraId/editar" element={<EditarObraPage />} />

      <Route path="/fornecedores" element={<FornecedoresPage />} />
      <Route path="/fornecedores/novo" element={<EditarFornecedorPage />} />
      <Route path="/fornecedores/:fornecedorId/editar" element={<EditarFornecedorPage />} />

      <Route path="/requisicao/:orcamentoId" element={<RequisicaoPage />} />
      <Route path="/requisicao/:orcamentoId/pdf" element={<RequisicaoPdfPage />} />
      <Route path="/mapas-cotacao/:orcamentoId" element={<MapaCotacaoPage />} />
      <Route path="/mapas-cotacao/:orcamentoId/importar" element={<ImportarCotacaoPage />} />
      <Route path="/mapas-cotacao/:orcamentoId/:cotacaoId/editar" element={<ImportarCotacaoPage />} />
      <Route path="/comparativo/:orcamentoId" element={<ComparativoPage />} />

      <Route path="/orcamento/:orcamentoId" element={<OrcamentoPage />} />
      <Route path="/orcamento/:orcamentoId/pdf" element={<PreviaPdfPage />} />
      <Route path="/orcamento/:orcamentoId/recebimento" element={<RecebimentoPage />} />
      <Route path="/orcamentos" element={<OrcamentosPage />} />

      <Route path="/usuarios" element={<UsuariosPage />} />
      <Route path="/usuarios/novo" element={<NovoUsuarioPage />} />
      <Route path="/usuarios/:usuarioId/editar" element={<EditarUsuarioPage />} />
      <Route path="/painel" element={<PainelPage />} />
    </Routes>
  );
}
