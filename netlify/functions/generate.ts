/*
  Netlify Function: Image measurement via Gemini
  - Uses process.env.GEMINI_API_KEY (do not expose to client)
  - Model: gemini-2.5-flash
  - API Version: v1
  - Input: { imageBase64: string, prompt?: string }
  - Output: { heightMm: number, widthMm: number, lengthMm: number, explanation?: string }
*/

import type { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ALLOWED_ORIGIN = '*';

const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(204, {});
  }
  if (event.httpMethod !== 'POST') {
    return buildResponse(405, { error: 'Método não permitido. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isLocalMock = !apiKey || apiKey === 'demo_local_key';

  let payload: { imageBase64?: string; base64Image?: string; prompt?: string } = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return buildResponse(400, { error: 'JSON inválido na requisição.' });
  }

  const imageBase64 = (payload.imageBase64 || payload.base64Image || '').trim();
  const userPrompt = (payload.prompt || '').trim();
  if (!imageBase64) {
    return buildResponse(422, { error: 'Imagem ausente. Envie o base64 da foto.' });
  }

  const prompt =
    userPrompt ||
    'Você é um assistente que mede dimensões básicas de uma amostra a partir de uma foto. Responda SOMENTE em JSON válido com as chaves: heightMm, widthMm, lengthMm. Use números em milímetros (mm). Se não tiver certeza absoluta, retorne null para o campo. Exemplo de resposta: {"heightMm": 10.2, "widthMm": 25.1, "lengthMm": 31.0}';

  try {
    // Modo mock para ambiente local sem chave real
    if (isLocalMock) {
      // Emula latência e resposta variável por imagem local
      await new Promise(r => setTimeout(r, 250));
      // Hash simples do base64 para variar resultados
      let hash = 0;
      for (let i = 0; i < Math.min(200, imageBase64.length); i++) {
        hash = (hash * 31 + imageBase64.charCodeAt(i)) >>> 0;
      }
      const base = (hash % 1000) / 10; // 0.0 - 100.0
      const h = Math.round((10 + (base % 30)) * 10) / 10; // 10 - 40 mm
      const w = Math.round((20 + ((base / 2) % 50)) * 10) / 10; // 20 - 70 mm
      const l = Math.round((30 + ((base / 3) % 70)) * 10) / 10; // 30 - 100 mm
      return buildResponse(200, {
        altura_mm: h,
        largura_mm: w,
        comprimento_mm: l,
        heightMm: h,
        widthMm: w,
        lengthMm: l,
        explanation: 'Resposta simulada (varia conforme imagem) em ambiente local.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1' }
    );

    const { response } = await model.generateContent({
      generationConfig: { responseMimeType: 'application/json' },
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const text = (response.text() || '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonCandidate = start >= 0 && end >= start ? text.slice(start, end + 1) : text;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonCandidate);
    } catch {
      return buildResponse(502, {
        error: 'Não foi possível interpretar a resposta da IA. Tente outra imagem.',
      });
    }

    const heightMm = Number(parsed?.heightMm);
    const widthMm = Number(parsed?.widthMm);
    const lengthMm = Number(parsed?.lengthMm);
    if (!Number.isFinite(heightMm) || !Number.isFinite(widthMm) || !Number.isFinite(lengthMm)) {
      return buildResponse(502, {
        error: 'Resposta incompleta da IA. Tente outra imagem.',
      });
    }

    return buildResponse(200, {
      // snake_case esperado pelo front
      altura_mm: heightMm,
      largura_mm: widthMm,
      comprimento_mm: lengthMm,
      // compatibilidade com versões anteriores
      heightMm,
      widthMm,
      lengthMm,
      explanation: 'Medidas estimadas a partir da imagem enviada.'
    });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Falha ao consultar o modelo.';
    // Normalizar mensagens comuns para o front mostrar algo amigável
    const isModelError = /model/i.test(message) || /404/.test(message);
    return buildResponse(isModelError ? 502 : 500, {
      error: isModelError
        ? 'Modelo indisponível no momento. Tente mais tarde.'
        : 'Erro interno ao processar sua solicitação.',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    });
  }
};



