/**
 * DMC:    VIZ-80-00-00-500A
 * Título: Integrações externas › API › Leitura de documento/áudio por IA (Gemini)
 * BREX:   VIZ-00-00-00-022A
 *
 * Único lugar com essa lógica agora — antes vivia duplicada entre
 * `vite.leitura-ia.ts` (dev, middleware do Vite) e `server.js`
 * (produção), porque dev e produção rodavam processos diferentes. Com
 * o servidor Express rodando em dev também (Vite só faz proxy de
 * `/api`, ver `vite.config.ts`), não há mais motivo pra duplicar.
 */
import { Router } from 'express';
import { exigirSessao } from '../auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPT_REQUISICAO =
  'Isto é um pedido de materiais para uma requisição de compra de obra de engenharia — pode ser um ' +
  'documento (PDF, planilha, foto de uma lista escrita à mão) ou um áudio de alguém falando os itens em ' +
  'voz alta. Leia ou ouça com atenção, palavra por palavra — é para uma compra real, erro de leitura ou de ' +
  'transcrição vira erro de pedido. Extraia TODOS os itens pedidos, exatamente como foram ditos ou escritos, ' +
  'sem resumir nem omitir nenhum; se for áudio, separe quantidade e unidade da descrição mesmo quando ditas ' +
  'juntas (ex.: "cem sacos de cimento" → descrição "Cimento", quantidade "100", unidade "saco"). ' +
  'Responda SOMENTE com um JSON válido, sem texto antes ou depois, sem markdown, no formato: ' +
  '{"itens":[{"descricao":"","quantidade":"","unidade":""}]}. ' +
  'Se não conseguir identificar algum campo, deixe como string vazia (nunca invente um valor). ' +
  'Nunca invente itens que não foram ditos ou escritos.';

const PROMPT_COTACAO =
  'Leia este documento (cotação de um fornecedor para uma obra de engenharia), palavra por palavra, ' +
  'número por número, com atenção — é para uma compra real, erro de leitura vira erro de preço. ' +
  'Extraia: dados de contato do fornecedor se aparecerem (nome, telefone, e-mail), o valor do frete se houver, ' +
  'e TODOS os itens cotados com descrição, quantidade e preço unitário, exatamente como no documento, sem omitir nenhum. ' +
  '"quantidade" e "precoUnitario" devem ser NÚMEROS JSON puros (ex.: 28.5), nunca texto, nunca com vírgula decimal, ' +
  'nunca com "R$" ou qualquer símbolo. ' +
  'Responda SOMENTE com um JSON válido, sem texto antes ou depois, sem markdown, no formato: ' +
  '{"fornecedor":{"nome":"","telefone":"","email":""},"frete":0,"itens":[{"descricao":"","quantidade":0,"precoUnitario":0}]}. ' +
  'Se não conseguir ler algum campo, deixe como string vazia ou 0 (nunca invente um valor). ' +
  'Nunca invente itens que não estão no documento.';

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** O Gemini grátis às vezes devolve 503 "alta demanda" — tenta de novo algumas vezes. */
async function chamarGemini(url: string, corpo: string, tentativas = 3): Promise<Response> {
  let ultimaResposta: Response | undefined;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const resposta = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo });
    if (resposta.status !== 503 || tentativa === tentativas) return resposta;
    ultimaResposta = resposta;
    await esperar(800 * tentativa);
  }
  return ultimaResposta!;
}

export const rotaLeituraIA = Router();
rotaLeituraIA.use(exigirSessao);

rotaLeituraIA.post('/', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({ erro: 'GEMINI_API_KEY não configurada no servidor.' });
    return;
  }
  try {
    const { mimeType, dataBase64, tipo } = req.body ?? {};
    const prompt = tipo === 'cotacao' ? PROMPT_COTACAO : PROMPT_REQUISICAO;

    const resposta = await chamarGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: dataBase64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    );

    const json = await resposta.json();
    if (!resposta.ok) {
      const mensagem = resposta.status === 503
        ? 'O Gemini está em alta demanda no momento — tente anexar de novo em alguns segundos.'
        : (json?.error?.message ?? 'Erro ao chamar o Gemini');
      res.status(resposta.status).json({ erro: mensagem });
      return;
    }

    const candidato = json.candidates?.[0];
    const texto = candidato?.content?.parts?.[0]?.text;
    if (!texto) {
      console.error('[ler-documento] sem texto na resposta:', JSON.stringify(json).slice(0, 500));
      res.status(502).json({ erro: `O Gemini não devolveu a leitura (motivo: ${candidato?.finishReason ?? 'desconhecido'}). Tente outro arquivo.` });
      return;
    }

    const textoLimpo = texto.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    try {
      JSON.parse(textoLimpo);
    } catch {
      console.error('[ler-documento] JSON inválido:', textoLimpo.slice(0, 500));
      res.status(502).json({ erro: 'O Gemini devolveu uma resposta que não é um JSON válido. Tente de novo.' });
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(textoLimpo);
  } catch (erro) {
    res.status(500).json({ erro: erro instanceof Error ? erro.message : String(erro) });
  }
});
