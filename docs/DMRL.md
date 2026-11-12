# DMRL — lista de módulos planejados · Vizze Compras (sigla `VIZ`)

Construída a partir do protótipo aprovado (E3). Todos os módulos abaixo começam `não-verificado`; passam a `verificacao-1` quando o BREX e os testes estiverem limpos, e a `verificacao-2` quando o usuário validar rodando o sistema real.

| DMC | Título | Arquivo (previsto) | Dependências | Status |
|---|---|---|---|---|
| VIZ-00-00-00-900A | Configuração do projeto | `src/app/config.ts` | — | não-verificado |
| VIZ-00-00-00-400A | Componente: menu de navegação persistente + voltar | `src/components/ui/AppShell.tsx` | — | não-verificado |
| VIZ-10-00-00-600A | Migração: usuários e perfis (master, engenheiro, comprador — sem e-mail obrigatório) | `supabase/migrations/..._usuarios.sql` | — | não-verificado |
| VIZ-10-00-00-300A | Sessão (login mock com credencial Master real) | `src/lib/auth.ts` | — | não-verificado |
| VIZ-10-00-00-400A | Tela de login | `src/features/10-identidade/00-login/components/LoginPage.tsx` | VIZ-10-00-00-300A, (depois: VIZ-10-00-00-600A, Supabase Auth) | não-verificado |
| VIZ-10-20-00-200A | Lógica: criação e exclusão de usuário (senha inicial, perfil) | `.../20-usuarios/logic.ts` | VIZ-10-00-00-600A | não-verificado |
| VIZ-10-20-00-400A | Tela: Usuários (Master — lista, criar e excluir) | `.../20-usuarios/components/UsuariosPage.tsx` | VIZ-10-20-00-200A | não-verificado |
| VIZ-20-00-00-600A | Migração: obras | `supabase/migrations/..._obras.sql` | — | não-verificado |
| VIZ-20-00-00-400A | Tela: Obras (lista e cadastro) | `src/features/20-cadastros/00-obras/components/ObrasPage.tsx` | VIZ-20-00-00-600A | não-verificado |
| VIZ-20-00-10-400A | Tela: Editar obra | `.../00-obras/components/EditarObraPage.tsx` | VIZ-20-00-00-600A | não-verificado |
| VIZ-20-10-00-600A | Migração: clientes | `supabase/migrations/..._clientes.sql` | — | não-verificado |
| VIZ-20-20-00-600A | Migração: fornecedores (nome, CNPJ, telefone, e-mail, forma de pagamento, chave PIX) | `supabase/migrations/..._fornecedores.sql` | — | não-verificado |
| VIZ-20-20-00-400A | Tela: Fornecedores (lista e cadastro) | `.../20-fornecedores/components/FornecedoresPage.tsx` | VIZ-20-20-00-600A | não-verificado |
| VIZ-20-20-10-400A | Tela: Editar fornecedor (contato e forma de pagamento) | `.../20-fornecedores/components/EditarFornecedorPage.tsx` | VIZ-20-20-00-600A | não-verificado |
| VIZ-30-00-00-600A | Migração: requisições e itens | `supabase/migrations/..._requisicoes.sql` | VIZ-20-00-00-600A | não-verificado |
| VIZ-30-00-00-400A | Tela: Nova requisição — escolha de obra, anexo com leitura por IA (Gemini) ou preenchimento manual, validar itens | `.../30-requisicao-cotacao/00-requisicao/components/RequisicaoPage.tsx` | VIZ-30-00-00-600A, VIZ-20-00-00-600A, VIZ-80-00-00-500B | verificacao-1 |
| VIZ-30-00-10-400A | Tela: PDF da requisição para fornecedores (impressão do navegador) | `.../00-requisicao/components/RequisicaoPdfPage.tsx` | VIZ-30-00-00-400A | verificacao-1 |
| VIZ-30-10-00-600A | Migração: mapas de cotação e cotações de fornecedor | `supabase/migrations/..._cotacoes.sql` | VIZ-30-00-00-600A, VIZ-20-20-00-600A | não-verificado |
| VIZ-30-10-00-400A | Tela: Mapa de cotação | `.../10-mapa-cotacao/components/MapaCotacaoPage.tsx` | VIZ-30-10-00-600A | não-verificado |
| VIZ-80-00-00-500A | Integração: leitura de documentos por IA (Gemini, servidor local do Vite) | `vite.leitura-ia.ts` | — | verificacao-1 |
| VIZ-80-00-00-500B | Cliente da leitura de documentos | `src/lib/leituraDocumento.ts` | VIZ-80-00-00-500A | verificacao-1 |
| VIZ-30-20-00-400A | Tela: Importar cotação (leitura + identificar fornecedor) | `.../20-leitura/components/ImportarCotacaoPage.tsx` | VIZ-80-00-00-500B, VIZ-30-10-00-600A | verificacao-1 |
| VIZ-30-30-00-200A | Lógica: cálculo do comparativo e sugestão automática | `.../30-comparativo/logic.ts` | VIZ-30-10-00-600A | não-verificado |
| VIZ-30-30-00-400A | Tela: Comparativo de preços | `.../30-comparativo/components/ComparativoPage.tsx` | VIZ-30-30-00-200A | não-verificado |
| VIZ-40-00-00-600A | Migração: orçamentos, versões e itens | `supabase/migrations/..._orcamentos.sql` | VIZ-30-30-00-200A | não-verificado |
| VIZ-40-00-00-200A | Lógica: aprovação, reprovação e versionamento | `.../40-orcamento/00-aprovacao/logic.ts` | VIZ-40-00-00-600A | não-verificado |
| VIZ-40-00-00-400A | Tela: Orçamento / aprovação | `.../00-aprovacao/components/OrcamentoPage.tsx` | VIZ-40-00-00-200A | não-verificado |
| VIZ-40-10-10-400A | Tela: Pré-visualização do PDF (impressão do navegador, `window.print()`) | `.../10-pdf/components/PreviaPdfPage.tsx` | VIZ-40-00-00-600A | verificacao-1 |
| VIZ-40-20-00-400A | Tela: Lista de orçamentos | `.../20-listagem/components/OrcamentosPage.tsx` | VIZ-40-00-00-600A | não-verificado |
