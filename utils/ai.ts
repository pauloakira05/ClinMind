import { computeStatus, StatusText } from './measurements';

export interface AnalysisResult {
  heightMm: number;
  widthMm: number;
  lengthMm: number;
  status: StatusText;
}

export async function analyzeImageFromDataUrl(dataUrl: string): Promise<AnalysisResult> {
  // Convert data URL to base64 content only
  const base64 = dataUrl.split(',')[1] || '';
  const prompt = `Você é um assistente que mede dimensões básicas de uma amostra a partir de uma foto.
Responda SOMENTE em JSON válido com as chaves: heightMm, widthMm, lengthMm.
Use números em milímetros (mm). Se não tiver certeza absoluta, retorne null para o campo.
Exemplo de resposta: {"heightMm": 10.2, "widthMm": 25.1, "lengthMm": 31.0}`;

  // Chamada ao backend serverless no Netlify
  const resp = await fetch('/.netlify/functions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, prompt }),
  });

  let parsed: { heightMm: number | null; widthMm: number | null; lengthMm: number | null } | null = null;
  try {
    parsed = await resp.json();
  } catch {
    throw new Error('Falha ao processar a resposta do servidor.');
  }
  if (!resp.ok) {
    const msg = (parsed as any)?.error || 'Falha ao consultar a IA.';
    throw new Error(msg);
  }

  const heightMm = Number(parsed?.heightMm);
  const widthMm = Number(parsed?.widthMm);
  const lengthMm = Number(parsed?.lengthMm);

  if (!Number.isFinite(heightMm) || !Number.isFinite(widthMm) || !Number.isFinite(lengthMm)) {
    throw new Error('Resposta inválida do servidor. Tente outra imagem.');
  }

  const status = computeStatus(heightMm, widthMm, lengthMm);
  return { heightMm, widthMm, lengthMm, status };
}


