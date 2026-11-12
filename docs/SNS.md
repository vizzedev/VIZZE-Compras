# SNS — numeração de sistemas · Vizze Compras (sigla `VIZ`)

Formato `SS-SE-AS`. Seções em múltiplos de 10; `00` é "geral" dentro de cada capítulo.

| SS | Sistema | Seções (SE) planejadas neste ciclo |
|---|---|---|
| 00 | Núcleo | `00` Layout, navegação, design system (tokens da Direção B) |
| 10 | Identidade e acesso | `00` Login/autenticação · `10` Perfis (Master, Engenheiro, Comprador) · `20` Gestão de usuários (Master cria contas) |
| 20 | Cadastros base | `00` Obras (com edição) · `10` Clientes · `20` Fornecedores (com edição — contato e forma de pagamento) |
| 30 | Requisição e cotação (domínio principal A) | `00` Requisição e itens · `10` Mapa de cotação e cotações de fornecedor · `20` Leitura automática (IA) · `30` Comparativo |
| 40 | Orçamento (domínio principal B) | `00` Montagem e versionamento · `10` Geração de PDF · `20` Listagem e acompanhamento |
| 50 | Financeiro e pagamentos | *(vazio neste ciclo — fora de escopo)* |
| 60 | Documentos e conformidade | `00` Retenção e acesso a documentos anexados (LGPD) |
| 70 | Arquivos e mídia | `00` Armazenamento de anexos de cotação (Supabase Storage) |
| 80 | Integrações externas | `00` Cliente do serviço de IA de leitura de documentos |
| 90 | Infraestrutura e administração | `00` Configuração e variáveis de ambiente |

O capítulo mantém o número mesmo vazio (ex.: `50`), para não remapear tudo se o escopo crescer num ciclo futuro.
