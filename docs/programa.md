# Programa do Produto — Sistema de requisição, cotação e orçamento

> E1 — Descoberta e imersão · v0.1 · 2026-10-27
> Nome: **Vizze Compras** (sigla DMC: `VIZ`).

## Problema e objetivo

O escritório de engenharia precisa montar orçamentos para clientes a partir de
compras reais: um engenheiro na obra levanta o que é necessário, o escritório
cota com vários fornecedores, compara preços (inclusive frete), monta o
orçamento final e só depois de um engenheiro aprovar é que ele vai para o
cliente. Hoje esse processo se perde em e-mail, WhatsApp e planilha solta,
sem rastro de quem aprovou o quê, e o trabalho mais pesado — ler cotações de
fornecedores em formatos diferentes e comparar — é manual.

**Métrica de sucesso proposta:** nenhum orçamento sai para o cliente sem uma
aprovação de engenheiro registrada (quem, quando), e o tempo entre a
requisição da obra e o orçamento liberado cai de dias para horas.

## Perfis de usuário

| Perfil | Pode fazer | Não pode fazer |
|---|---|---|
| **Master** | Tudo que o Engenheiro faz (é o engenheiro-chefe) **+** criar, editar e **excluir** usuários (nome, senha inicial, perfil Engenheiro ou Comprador) | — |
| **Engenheiro** | Tudo que o Comprador faz **+ excluir obra**, criar requisição, criar mapa de cotação, anexar e revisar cotações de fornecedor, montar orçamento, **aprovar ou reprovar orçamento** | Criar, editar ou excluir outros usuários |
| **Comprador** | Criar/editar obra, cadastrar/editar/**excluir fornecedor**, criar requisição, criar mapa de cotação, anexar e revisar cotações de fornecedor, montar orçamento | **Excluir obra**; aprovar ou reprovar orçamento; criar, editar ou excluir usuários |

Qualquer Engenheiro ou Master pode aprovar qualquer orçamento, mesmo sem ter
participado dele — o orçamento aprovado registra **quem aprovou**, para
consulta futura. Usuários (Engenheiro/Comprador) não se auto-cadastram: o
Master cria cada conta com nome e senha inicial e define o perfil; pode
excluir contas que ele mesmo criou. E-mail não é obrigatório no cadastro de
usuário neste ciclo — só nome, senha e perfil.

## Jornadas principais

**Jornada 1 — Do pedido na obra ao orçamento no cliente**
1. Engenheiro ou comprador seleciona a obra (ou cadastra uma nova) e cria a requisição com os itens necessários.
2. Cria o mapa de cotação a partir da requisição.
3. Envia aos fornecedores (fora do sistema — telefone, e-mail, WhatsApp).
4. Fornecedor responde em qualquer formato (PDF, imagem/print, documento de texto, Excel). Quem está cuidando da cotação **anexa o arquivo** no sistema.
5. O sistema **lê automaticamente** o anexo (itens, preços, frete, outros custos) e tenta casar cada item lido com o item correspondente da requisição.
6. Quem anexou **revisa a leitura**: confirma ou corrige itens, preços, frete e os vínculos sugeridos pela IA. Nada entra no comparativo sem essa confirmação.
7. O comparativo mostra, por item, o preço de cada fornecedor, com **sugestão automática do mais barato**, ajustável manualmente; um resumo mostra o total geral e o total por fornecedor (com frete incluído).
8. A partir do comparativo, monta-se o orçamento final e envia-se para aprovação.
9. Um engenheiro aprova (fica registrado quem) ou reprova.
10. **Se reprovar:** precisa de um comentário obrigatório, podendo marcar itens específicos como ponto de atenção. Volta para o comprador, que corrige e reenvia — isso **cria uma nova versão**, mantendo a versão reprovada no histórico.
11. Uma vez aprovado, aparece um aviso de que o **PDF foi gerado**, com uma **pré-visualização** do documento (data, cabeçalho da obra/cliente, itens, totais). O envio ao cliente em si é manual, por fora do sistema, neste ciclo.

**Jornada 2 — Consultar histórico de uma obra**
Selecionar uma obra já cadastrada e ver requisições, cotações e orçamentos anteriores (pensado desde já no cadastro de obra, mesmo que o histórico completo não seja o foco deste ciclo).

## Entidades e ações

**Entidades (substantivos):** Usuário (Master, Engenheiro, Comprador), Obra, Requisição, Item de requisição, Mapa de cotação, Fornecedor (nome, telefone, e-mail, forma de pagamento, dados de PIX), Cotação de fornecedor (arquivo anexado + dados extraídos), Item de cotação, Custo adicional (frete, outros), Comparativo, Orçamento, Versão de orçamento, Aprovação/Reprovação (comentário + itens marcados), Cliente.

**Ações (verbos):** criar usuário (Master), cadastrar/selecionar/editar obra, cadastrar/editar fornecedor, criar requisição, criar mapa de cotação, anexar cotação, ler cotação (IA — itens, preços, frete **e dados de contato do fornecedor**), revisar/corrigir extração, montar comparativo, ajustar sugestão automática, montar orçamento, aprovar orçamento, reprovar orçamento, reenviar (nova versão), gerar PDF, liberar orçamento.

### Fornecedor — dados cadastrais (ajuste pós-E3)

Cada fornecedor passa a ter, além de nome e CNPJ: **telefone**, **e-mail**, **forma de pagamento** (boleto, PIX, transferência) e, quando for PIX, a **chave PIX**. A leitura automática da cotação tenta extrair telefone/e-mail do documento e sugere o preenchimento do cadastro do fornecedor (mesma lógica de "sugestão revisável" da leitura de preços). Editável a qualquer momento por Engenheiro ou Comprador.

**Questão aberta:** a forma de pagamento/PIX do fornecedor aparece no PDF enviado ao *cliente final*, ou é só uma informação interna para o comprador saber como pagar o fornecedor? Assumo **interna** por padrão (dado sensível do fornecedor, sem motivo aparente para o cliente ver) — avisar se for diferente.

## Glossário inicial (termo único em banco, código e tela)

| Termo | Significado | Nunca confundir com |
|---|---|---|
| **Cotação (do fornecedor)** | O preço que um fornecedor específico enviou, por item, mais frete/outros custos | *Orçamento* (documento final ao cliente) |
| **Mapa de cotação** | O conjunto de cotações de vários fornecedores para a mesma requisição | *Comparativo* (a visão lado a lado) |
| **Comparativo** | Visão lado a lado dos preços de cada fornecedor por item, com sugestão automática | *Orçamento* (o resultado final montado a partir dele) |
| **Orçamento** | O documento final, aprovado, que vai para o cliente | *Cotação* |
| **Versão** | Cada reenvio de um orçamento reprovado gera uma nova versão; a anterior fica no histórico | — |

## Plataforma

Proposta: **web responsivo**, desktop-first (o trabalho de anexar/revisar cotações e planilhas pede tela grande), mas funcional em celular para a etapa de aprovação do engenheiro em campo. Decisão reversível — ajusto se o uso real mostrar outra necessidade.

## Integrações e restrições

- **Leitura automática de documentos** (PDF, imagem, texto, Excel) via IA — é o maior risco técnico do projeto (ver seção de riscos). Recomendo um pequeno teste com documentos reais do escritório antes de construir a tela completa de revisão.
- Fornecedores **não** acessam o sistema nesta versão — tudo chega por fora (e-mail, WhatsApp, telefone) e é anexado manualmente.
- Geração de PDF do orçamento final para o cliente. Envio ao cliente é manual neste ciclo.
- Dados pessoais envolvidos: contatos de fornecedores e dados do cliente no orçamento (nome, CNPJ/CPF, endereço) — sensibilidade moderada (dados empresariais/contato), mas exige LGPD padrão (acesso controlado, retenção definida).

## Fora do escopo deste ciclo

- Portal para o fornecedor preencher a cotação diretamente (cotação continua chegando por fora e sendo anexada).
- Envio automático do orçamento ao cliente (e-mail automático) — fica manual.
- Integração com ERP existente, se houver.
- Alçada de aprovação por valor (qualquer engenheiro aprova qualquer orçamento nesta versão).
- Sugestão de fornecedor por histórico de preços (oportunidade para um ciclo futuro — ver riscos/oportunidades).

## Leitura do parceiro — riscos e oportunidades

- **Risco maior (técnico):** a leitura automática de documentos tão variados (foto de WhatsApp, PDF, Excel) nunca será 100% confiável. Por isso todo dado lido passa por uma tela de revisão obrigatória antes de entrar no comparativo — a IA sugere, a pessoa confirma. Proponho prototipar essa tela com documentos reais do escritório antes de construir o resto, para validar se a extração é boa o suficiente na prática.
- **Risco:** itens com nomes parecidos entre fornecedores (ex. "cimento CP-II 50kg" vs "cimento Portland 50kg") podem confundir o casamento automático. A revisão manual cobre isso, mas vale acompanhar a taxa de acerto nos primeiros usos reais.
- **Oportunidade:** o comparativo com sugestão automática é o maior ganho de tempo do sistema — hoje provavelmente feito numa planilha solta, item por item, à mão.
- **Oportunidade (futura, fora deste ciclo):** com histórico de cotações por fornecedor e por item, o sistema pode um dia sugerir "fornecedor X costuma ser mais barato em Y" — vale guardar os dados de um jeito que permita isso depois, mesmo sem construir agora.

## Nível de maturidade proposto

| Nível | Quando | Recomendação |
|---|---|---|
| N0 — Protótipo | Só para testar a tela de revisão da leitura automática com documentos reais, antes de decidir a arquitetura final | Recomendo como um teste rápido pontual, não o ciclo inteiro |
| **N1 — MVP local** | Sistema real, rodando localmente, uso pelo escritório (engenheiros e compradores) | **Recomendo para este ciclo** |
| N2 — MVP online | Publicado, acessível de qualquer lugar (engenheiro aprovando da obra pelo celular) | Próximo passo natural, depois do fluxo validado em uso real |

## Questões abertas (não bloqueiam o G1, mas ficam no radar)

1. Forma de pagamento/PIX do fornecedor no PDF do cliente — assumido **interno**, só para o comprador (ver seção "Fornecedor" acima); avisar se for diferente.
2. Logo do escritório no PDF — ainda não pedido; incluir campo quando o usuário tiver a arte.

**Resolvido (ajuste pós-E3):** o PDF do orçamento traz data de emissão, número e versão do orçamento, cabeçalho com dados da obra e do cliente, quem aprovou, o **comparativo por fornecedor** (preço de cada fornecedor por item, com o escolhido destacado — para o cliente entender onde cada item foi comprado), o **resumo por fornecedor** (total cotado com cada um) e o resumo final com os itens selecionados, subtotal, frete e total.

## Decisões registradas

Ver `docs/decisoes.md` para o histórico completo.
