// brex-excecao P10-04: dados de demonstração (não lógica) — um bloco por
// orçamento, cada um já numeroso por natureza; dividir quebraria a leitura
// de cada caso completo.
/**
 * DMC:    VIZ-00-00-00-600E
 * Título: Núcleo › Seed de demonstração (só desenvolvimento)
 * BREX:   VIZ-00-00-00-022A
 *
 * NUNCA roda em produção (ver server/index.ts — só é chamado quando
 * `NODE_ENV !== 'production'`, e mesmo assim só se o banco estiver
 * vazio). Portado de `src/lib/dadosDemonstracao.ts` e
 * `dadosDemonstracaoOrcamentos.ts` (removidos do bundle do cliente —
 * essa era a "limpeza dos exemplos" pedida).
 */
import { db } from './client';
import { obras, fornecedores, usuarios, usuariosObras, orcamentos, versoesOrcamento, cotacoesImportadas, recebimentos, historicoOrcamento, notificacoes, contadores } from './schema';
import { gerarHash } from '../auth';

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString();
}

export async function seedDemo(): Promise<void> {
  const existentes = await db.select({ id: orcamentos.id }).from(orcamentos).limit(1);
  if (existentes.length > 0) return; // já tem dado — nunca sobrescreve

  await db.insert(obras).values([
    { id: '1', nome: 'Edifício Alfa', cliente: 'Construtora Horizonte', endereco: 'Rua das Palmeiras, 450 — São Paulo, SP' },
    { id: '2', nome: 'Residencial Vista Verde', cliente: 'Incorporadora Rumo', endereco: 'Av. dos Ipês, 1200 — Campinas, SP' },
    { id: '3', nome: 'Galpão Industrial Delta', cliente: 'Logística Tramontina', endereco: 'Rod. Hélio Smidt, km 8 — Guarulhos, SP' },
    { id: '4', nome: 'Reforma Comercial Atlas', cliente: 'Grupo Atlas Shopping', endereco: 'Av. Paulista, 1500 — São Paulo, SP' },
    { id: '5', nome: 'Condomínio Jardins do Sul', cliente: 'Construtora Meridiano', endereco: 'Estrada dos Romeiros, 3200 — Sorocaba, SP' },
  ]);

  await db.insert(fornecedores).values([
    { id: '1', nome: 'Aço Brasil Ltda', cnpj: '12.345.678/0001-90', telefone: '(11) 98888-1234', email: 'contato@acobrasil.com.br', formaPagamento: 'PIX', chavePix: '12.345.678/0001-90' },
    { id: '2', nome: 'Hidráulica Center Materiais', cnpj: '23.456.789/0001-11', telefone: '(11) 97777-4321', email: 'comercial@hidraulicacenter.com.br', formaPagamento: 'Boleto', chavePix: '' },
    { id: '3', nome: 'Elétrica Minas Fornecimentos', cnpj: '34.567.890/0001-22', telefone: '(31) 3322-5566', email: 'vendas@eletricaminas.com.br', formaPagamento: 'PIX', chavePix: 'eletricaminas@pix.com.br' },
    { id: '4', nome: 'Concreto Forte Usinagem', cnpj: '45.678.901/0001-33', telefone: '(11) 2233-4455', email: 'comercial@concretoforte.com.br', formaPagamento: 'Boleto', chavePix: '' },
    { id: '5', nome: 'Acabamentos Prisma Ltda', cnpj: '56.789.012/0001-44', telefone: '(11) 3344-5566', email: 'vendas@acabamentosprisma.com.br', formaPagamento: 'PIX', chavePix: '56.789.012/0001-44' },
    { id: '6', nome: 'Madeireira Union Comercial', cnpj: '67.890.123/0001-55', telefone: '(19) 3355-6677', email: 'contato@madeireiraunion.com.br', formaPagamento: 'Boleto', chavePix: '' },
    { id: '7', nome: 'Ferragens São Jorge', cnpj: '78.901.234/0001-66', telefone: '(11) 4466-7788', email: 'pedidos@ferragenssaojorge.com.br', formaPagamento: 'PIX', chavePix: '78.901.234/0001-66' },
    { id: '8', nome: 'Materiais São José Ltda', cnpj: '89.012.345/0001-77', telefone: '(11) 5566-7788', email: 'comercial@materiaissaojose.com.br', formaPagamento: 'Boleto', chavePix: '' },
  ]);

  const senhaHash = await gerarHash('123456');
  await db.insert(usuarios).values([
    { id: 'u1', nome: 'Marina Alves', senhaHash, perfil: 'Comprador' },
    { id: 'u2', nome: 'João Pereira', senhaHash, perfil: 'Engenheiro' },
    { id: 'u3', nome: 'Carla Souza', senhaHash, perfil: 'Engenheiro' },
    { id: 'u4', nome: 'Rafael Lima', senhaHash, perfil: 'Comprador' },
    { id: 'u5', nome: 'Zé Carlos', senhaHash, perfil: 'Encarregado' },
    { id: 'u6', nome: 'Pedro Nascimento', senhaHash, perfil: 'Encarregado' },
  ]);
  await db.insert(usuariosObras).values([
    { usuarioId: 'u5', obraId: '1' }, { usuarioId: 'u5', obraId: '3' },
    { usuarioId: 'u6', obraId: '1' }, { usuarioId: 'u6', obraId: '2' },
  ]);

  await db.insert(orcamentos).values([
    { id: 'orc-a', codigo: 'OR-0043', etapa: 'requisicao', obraId: '3', obraNome: 'Galpão Industrial Delta', cliente: 'Logística Tramontina', compradorResponsavel: 'Rafael Lima', criadoEm: new Date(horasAtras(3)), itensRequisicao: [], requisicaoValidada: false },
    { id: 'orc-b', codigo: 'OR-0044', etapa: 'cotacao', obraId: '4', obraNome: 'Reforma Comercial Atlas', cliente: 'Grupo Atlas Shopping', compradorResponsavel: 'Marina Alves', criadoEm: new Date(horasAtras(50)), itensRequisicao: [{ descricao: 'Piso porcelanato 60x60cm', quantidade: '320', unidade: 'm²' }, { descricao: 'Argamassa ACIII 20kg', quantidade: '60', unidade: 'saco' }, { descricao: 'Rodapé MDF 10cm', quantidade: '180', unidade: 'm' }], requisicaoValidada: true, codigoCotacao: 'COT-0002', requisicaoEnviadaEm: new Date(horasAtras(48)) },
    { id: 'orc-c', codigo: 'OR-0045', etapa: 'comparativo', obraId: '5', obraNome: 'Condomínio Jardins do Sul', cliente: 'Construtora Meridiano', compradorResponsavel: 'Rafael Lima', criadoEm: new Date(horasAtras(124)), itensRequisicao: [{ descricao: 'Concreto usinado fck 25 MPa', quantidade: '45', unidade: 'm³' }, { descricao: 'Bloco de concreto 14x19x39', quantidade: '3000', unidade: 'un' }], requisicaoValidada: true, codigoCotacao: 'COT-0003', requisicaoEnviadaEm: new Date(horasAtras(120)) },
    { id: 'orc-d', codigo: 'OR-0046', etapa: 'rascunho', obraId: '1', obraNome: 'Edifício Alfa', cliente: 'Construtora Horizonte', compradorResponsavel: 'Marina Alves', criadoEm: new Date(horasAtras(50)), itensRequisicao: [{ descricao: 'Vergalhão CA-50 10mm', quantidade: '200', unidade: 'barra' }], requisicaoValidada: true, codigoCotacao: 'COT-0004', requisicaoEnviadaEm: new Date(horasAtras(48)), mapaMontadoEm: new Date(horasAtras(24)) },
    { id: 'orc-e', codigo: 'OR-0047', etapa: 'rascunho', obraId: '2', obraNome: 'Residencial Vista Verde', cliente: 'Incorporadora Rumo', compradorResponsavel: 'Marina Alves', criadoEm: new Date(horasAtras(52)), itensRequisicao: [{ descricao: 'Cabo elétrico 2,5mm² (rolo 100m)', quantidade: '15', unidade: 'rolo' }], requisicaoValidada: true, codigoCotacao: 'COT-0005', requisicaoEnviadaEm: new Date(horasAtras(49)), mapaMontadoEm: new Date(horasAtras(48)) },
    { id: 'orc-f', codigo: 'OR-0048', etapa: 'rascunho', obraId: '1', obraNome: 'Edifício Alfa', cliente: 'Construtora Horizonte', compradorResponsavel: 'Marina Alves', criadoEm: new Date(horasAtras(150)), itensRequisicao: [{ descricao: 'Tijolo cerâmico 9 furos', quantidade: '5000', unidade: 'un' }], requisicaoValidada: true, codigoCotacao: 'COT-0006', requisicaoEnviadaEm: new Date(horasAtras(148)), mapaMontadoEm: new Date(horasAtras(144)) },
    { id: 'orc-g', codigo: 'OR-0049', etapa: 'rascunho', obraId: '2', obraNome: 'Residencial Vista Verde', cliente: 'Incorporadora Rumo', compradorResponsavel: 'Rafael Lima', criadoEm: new Date(horasAtras(100)), itensRequisicao: [{ descricao: 'Telha fibrocimento 6mm 2,44x1,10m', quantidade: '400', unidade: 'un' }], requisicaoValidada: true, codigoCotacao: 'COT-0007', requisicaoEnviadaEm: new Date(horasAtras(98)), mapaMontadoEm: new Date(horasAtras(96)) },
    { id: 'orc-h', codigo: 'OR-0050', etapa: 'rascunho', obraId: '5', obraNome: 'Condomínio Jardins do Sul', cliente: 'Construtora Meridiano', compradorResponsavel: 'Marina Alves', criadoEm: new Date(horasAtras(170)), itensRequisicao: [{ descricao: 'Tinta acrílica premium 18L', quantidade: '40', unidade: 'lata' }, { descricao: "Lixa d'água grão 220", quantidade: '100', unidade: 'folha' }], requisicaoValidada: true, codigoCotacao: 'COT-0008', requisicaoEnviadaEm: new Date(horasAtras(168)), mapaMontadoEm: new Date(horasAtras(144)) },
  ]);

  await db.insert(versoesOrcamento).values([
    { id: 'v-d1', orcamentoId: 'orc-d', versao: 1, status: 'rascunho', criadaEm: new Date(horasAtras(24)), frete: '650', totaisPorFornecedor: { 'Aço Brasil Ltda': 8750, 'Materiais São José Ltda': 9400 }, itens: [{ item: 'Vergalhão CA-50 10mm', porFornecedor: { 'Aço Brasil Ltda': 8400, 'Materiais São José Ltda': 9100 }, fornecedorEscolhido: 'Aço Brasil Ltda' }] },
    { id: 'v-e1', orcamentoId: 'orc-e', versao: 1, status: 'em_aprovacao', criadaEm: new Date(horasAtras(48)), enviadaParaAprovacaoEm: new Date(horasAtras(6)), frete: '150', totaisPorFornecedor: { 'Elétrica Minas Fornecimentos': 4800 }, itens: [{ item: 'Cabo elétrico 2,5mm² (rolo 100m)', porFornecedor: { 'Elétrica Minas Fornecimentos': 4650 }, fornecedorEscolhido: 'Elétrica Minas Fornecimentos' }] },
    { id: 'v-f1', orcamentoId: 'orc-f', versao: 1, status: 'reprovado', criadaEm: new Date(horasAtras(144)), enviadaParaAprovacaoEm: new Date(horasAtras(120)), decididaEm: new Date(horasAtras(96)), justificativa: 'Fornecedor escolhido está sem estoque imediato — troque para a Materiais São José.', frete: '650', totaisPorFornecedor: { 'Materiais São José Ltda': 5000, 'Concreto Forte Usinagem': 5650 }, itens: [{ item: 'Tijolo cerâmico 9 furos', porFornecedor: { 'Materiais São José Ltda': 4750, 'Concreto Forte Usinagem': 5250 }, fornecedorEscolhido: 'Concreto Forte Usinagem', pontoAtencao: true }] },
    { id: 'v-f2', orcamentoId: 'orc-f', versao: 2, status: 'aprovado', criadaEm: new Date(horasAtras(96)), enviadaParaAprovacaoEm: new Date(horasAtras(72)), decididaEm: new Date(horasAtras(48)), aprovadoPor: 'João Pereira (Engenheiro)', frete: '650', totaisPorFornecedor: { 'Materiais São José Ltda': 5000, 'Concreto Forte Usinagem': 5650 }, itens: [{ item: 'Tijolo cerâmico 9 furos', porFornecedor: { 'Materiais São José Ltda': 4750, 'Concreto Forte Usinagem': 5250 }, fornecedorEscolhido: 'Materiais São José Ltda' }] },
    { id: 'v-g1', orcamentoId: 'orc-g', versao: 1, status: 'aprovado', criadaEm: new Date(horasAtras(96)), enviadaParaAprovacaoEm: new Date(horasAtras(72)), decididaEm: new Date(horasAtras(48)), aprovadoPor: 'Carla Souza (Engenheiro)', frete: '900', totaisPorFornecedor: { 'Materiais São José Ltda': 28100 }, itens: [{ item: 'Telha fibrocimento 6mm 2,44x1,10m', porFornecedor: { 'Materiais São José Ltda': 27200 }, fornecedorEscolhido: 'Materiais São José Ltda' }] },
    { id: 'v-h1', orcamentoId: 'orc-h', versao: 1, status: 'aprovado', criadaEm: new Date(horasAtras(144)), enviadaParaAprovacaoEm: new Date(horasAtras(120)), decididaEm: new Date(horasAtras(120)), aprovadoPor: 'João Pereira (Engenheiro)', frete: '380', totaisPorFornecedor: { 'Acabamentos Prisma Ltda': 12850, 'Materiais São José Ltda': 12210 }, itens: [{ item: 'Tinta acrílica premium 18L', porFornecedor: { 'Acabamentos Prisma Ltda': 12400, 'Materiais São José Ltda': 11800 }, fornecedorEscolhido: 'Materiais São José Ltda' }, { item: "Lixa d'água grão 220", porFornecedor: { 'Acabamentos Prisma Ltda': 250, 'Materiais São José Ltda': 230 }, fornecedorEscolhido: 'Materiais São José Ltda' }] },
    { id: 'v-h2', orcamentoId: 'orc-h', versao: 2, status: 'aprovado', criadaEm: new Date(horasAtras(24)), aprovadoPor: 'João Pereira (Engenheiro)', editadoPor: 'João Pereira (Engenheiro)', notaEdicao: 'Cliente pediu para priorizar a entrega mais rápida da Prisma, mesmo com custo pouco maior na tinta.', frete: '380', totaisPorFornecedor: { 'Acabamentos Prisma Ltda': 12850, 'Materiais São José Ltda': 12210 }, itens: [{ item: 'Tinta acrílica premium 18L', porFornecedor: { 'Acabamentos Prisma Ltda': 12400, 'Materiais São José Ltda': 11800 }, fornecedorEscolhido: 'Acabamentos Prisma Ltda' }, { item: "Lixa d'água grão 220", porFornecedor: { 'Acabamentos Prisma Ltda': 250, 'Materiais São José Ltda': 230 }, fornecedorEscolhido: 'Materiais São José Ltda' }] },
  ]);

  await db.insert(cotacoesImportadas).values([
    { id: 'cot-c1', orcamentoId: 'orc-c', fornecedorId: '4', fornecedorNome: 'Concreto Forte Usinagem', arquivo: 'cotacao_concreto_forte.pdf', frete: '800', itens: [{ item: 'Concreto usinado fck 25 MPa', quantidade: 45, precoUnitario: 420, subtotal: 18900 }, { item: 'Bloco de concreto 14x19x39', quantidade: 3000, precoUnitario: 3.2, subtotal: 9600 }] },
    { id: 'cot-c2', orcamentoId: 'orc-c', fornecedorId: '8', fornecedorNome: 'Materiais São José Ltda', arquivo: 'cotacao_sao_jose.xlsx', frete: '600', itens: [{ item: 'Concreto usinado fck 25 MPa', quantidade: 45, precoUnitario: 455, subtotal: 20475 }, { item: 'Bloco de concreto 14x19x39', quantidade: 3000, precoUnitario: 3.45, subtotal: 10350 }] },
    { id: 'cot-d1', orcamentoId: 'orc-d', fornecedorId: '1', fornecedorNome: 'Aço Brasil Ltda', arquivo: 'cotacao_aco_brasil.pdf', frete: '350', itens: [{ item: 'Vergalhão CA-50 10mm', quantidade: 200, precoUnitario: 42, subtotal: 8400 }] },
    { id: 'cot-d2', orcamentoId: 'orc-d', fornecedorId: '8', fornecedorNome: 'Materiais São José Ltda', arquivo: 'cotacao_sao_jose_vergalhao.xlsx', frete: '300', itens: [{ item: 'Vergalhão CA-50 10mm', quantidade: 200, precoUnitario: 45.5, subtotal: 9100 }] },
    { id: 'cot-e1', orcamentoId: 'orc-e', fornecedorId: '3', fornecedorNome: 'Elétrica Minas Fornecimentos', arquivo: 'cotacao_eletrica_minas.pdf', frete: '150', itens: [{ item: 'Cabo elétrico 2,5mm² (rolo 100m)', quantidade: 15, precoUnitario: 310, subtotal: 4650 }] },
    { id: 'cot-f1', orcamentoId: 'orc-f', fornecedorId: '8', fornecedorNome: 'Materiais São José Ltda', arquivo: 'cotacao_sao_jose_tijolo.xlsx', frete: '250', itens: [{ item: 'Tijolo cerâmico 9 furos', quantidade: 5000, precoUnitario: 0.95, subtotal: 4750 }] },
    { id: 'cot-f2', orcamentoId: 'orc-f', fornecedorId: '4', fornecedorNome: 'Concreto Forte Usinagem', arquivo: 'cotacao_concreto_forte_tijolo.pdf', frete: '400', itens: [{ item: 'Tijolo cerâmico 9 furos', quantidade: 5000, precoUnitario: 1.05, subtotal: 5250 }] },
    { id: 'cot-g1', orcamentoId: 'orc-g', fornecedorId: '8', fornecedorNome: 'Materiais São José Ltda', arquivo: 'cotacao_sao_jose_telha.xlsx', frete: '900', itens: [{ item: 'Telha fibrocimento 6mm 2,44x1,10m', quantidade: 400, precoUnitario: 68, subtotal: 27200 }] },
    { id: 'cot-h1', orcamentoId: 'orc-h', fornecedorId: '5', fornecedorNome: 'Acabamentos Prisma Ltda', arquivo: 'cotacao_prisma_tinta.pdf', frete: '200', itens: [{ item: 'Tinta acrílica premium 18L', quantidade: 40, precoUnitario: 310, subtotal: 12400 }, { item: "Lixa d'água grão 220", quantidade: 100, precoUnitario: 2.5, subtotal: 250 }] },
    { id: 'cot-h2', orcamentoId: 'orc-h', fornecedorId: '8', fornecedorNome: 'Materiais São José Ltda', arquivo: 'cotacao_sao_jose_tinta.xlsx', frete: '180', itens: [{ item: 'Tinta acrílica premium 18L', quantidade: 40, precoUnitario: 295, subtotal: 11800 }, { item: "Lixa d'água grão 220", quantidade: 100, precoUnitario: 2.3, subtotal: 230 }] },
  ]);

  await db.insert(recebimentos).values([
    { id: 'receb-g1', orcamentoId: 'orc-g', tipo: 'completo', itensRecebidos: ['Telha fibrocimento 6mm 2,44x1,10m'], fotoNotaFiscal: 'nf_sao_jose_0912.jpg', recebidoPor: 'Zé Carlos (Encarregado)', recebidoEm: new Date(horasAtras(20)), observacao: 'Carga conferida na chegada, sem avarias.' },
    { id: 'receb-h1', orcamentoId: 'orc-h', tipo: 'parcial', itensRecebidos: ['Tinta acrílica premium 18L'], fotoNotaFiscal: 'nf_prisma_tinta_0421.jpg', recebidoPor: 'Zé Carlos (Encarregado)', recebidoEm: new Date(horasAtras(10)), observacao: 'Lixa ainda não chegou — fornecedor avisou atraso de 2 dias.' },
  ]);

  await db.insert(historicoOrcamento).values([
    { id: 'hist-h1', orcamentoId: 'orc-h', tipo: 'item_removido', descricao: 'Item "Massa corrida PVA 25kg" removido da requisição', justificativa: 'Fornecedor informou que parou de fabricar esse item — substituído pela tinta acrílica premium.', autor: 'Marina Alves (Comprador)', registradoEm: new Date(horasAtras(146)) },
  ]);

  await db.insert(notificacoes).values([
    { id: 'notif-1', perfilDestino: 'Engenheiro', mensagem: 'Orçamento OR-0047 (Residencial Vista Verde) aguardando aprovação.', orcamentoId: 'orc-e', criadaEm: new Date(horasAtras(6)), lida: false },
    { id: 'notif-2', perfilDestino: 'Comprador', usuarioDestino: 'Marina Alves', mensagem: 'Orçamento OR-0048 (Edifício Alfa) foi reprovado: "Fornecedor escolhido está sem estoque imediato — troque para a Materiais São José."', orcamentoId: 'orc-f', criadaEm: new Date(horasAtras(96)), lida: true },
  ]);

  await db.insert(contadores).values({ id: 1, orcamentoProximo: 51, cotacaoProximo: 9 }).onConflictDoUpdate({
    target: contadores.id,
    set: { orcamentoProximo: 51, cotacaoProximo: 9 },
  });
  console.log('[seed] dados de demonstração inseridos.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemo()
    .then(() => process.exit(0))
    .catch((erro) => { console.error(erro); process.exit(1); });
}
