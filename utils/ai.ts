import { computeStatus, StatusText } from './measurements';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnalysisResult {
  heightMm: number;
  widthMm: number;
  lengthMm: number;
  status: StatusText;
}

// Placeholder AI analysis. Replace this with a real model integration later.
export async function analyzeImageFromDataUrl(dataUrl: string): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY não configurada. Adicione ao arquivo .env e reinicie.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Convert data URL to base64 content only
  const base64 = dataUrl.split(',')[1] || '';

  const prompt = `Você é um assistente que mede dimensões básicas de uma amostra a partir de uma foto.
Responda SOMENTE em JSON válido com as chaves: heightMm, widthMm, lengthMm.
Use números em milímetros (mm). Se não tiver certeza absoluta, retorne null para o campo.
Exemplo de resposta: {"heightMm": 10.2, "widthMm": 25.1, "lengthMm": 31.0}`;

  const result = await model.generateContent({
    generationConfig: {
      responseMimeType: 'application/json',
    },
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
  });

  const text = result.response.text().trim();
  let parsed: { heightMm: number | null; widthMm: number | null; lengthMm: number | null } | null = null;
  try {
    // Extract first JSON object from text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
    parsed = JSON.parse(json);
  } catch {}

  const heightMm = Number(parsed?.heightMm);
  const widthMm = Number(parsed?.widthMm);
  const lengthMm = Number(parsed?.lengthMm);

  if (!Number.isFinite(heightMm) || !Number.isFinite(widthMm) || !Number.isFinite(lengthMm)) {
    throw new Error('Resposta inválida do Gemini. Tente outra imagem.');
  }

  const status = computeStatus(heightMm, widthMm, lengthMm);
  return { heightMm, widthMm, lengthMm, status };
}


