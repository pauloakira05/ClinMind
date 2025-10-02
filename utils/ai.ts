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
    // Adequar ao contrato esperado pela Function publicada
    body: JSON.stringify({ base64Image: base64, prompt}),
  });

  let parsed: any = null;
  try {
    parsed = await resp.json();
  } catch {
    throw new Error('Falha ao processar a resposta do servidor.');
  }
  if (!resp.ok) {
    // Mapear mensagens amigáveis por status
    if (resp.status === 400 || resp.status === 422) {
      throw new Error('Não foi possível analisar a imagem. Tente novamente ou tire outra foto.');
    }
    if (resp.status === 413) {
      throw new Error('Imagem muito grande para enviar. Reduza a resolução e tente novamente.');
    }
    if (resp.status === 500) {
      const msg = typeof parsed?.error === 'string' ? parsed.error : '';
      if (/api key|GEMINI_API_KEY|missing/i.test(msg)) {
        throw new Error('Configuração de servidor ausente. Tente novamente mais tarde.');
      }
      throw new Error('Erro interno ao processar sua solicitação.');
    }
    const msg = typeof parsed?.error === 'string' ? parsed.error : 'Falha ao consultar a IA.';
    throw new Error(msg);
  }

  // Adaptar aos nomes esperados pela Function do usuário
  const heightMm = Number(parsed?.altura_mm ?? parsed?.heightMm);
  const widthMm = Number(parsed?.largura_mm ?? parsed?.widthMm);
  const lengthMm = Number(parsed?.comprimento_mm ?? parsed?.lengthMm);

  if (!Number.isFinite(heightMm) || !Number.isFinite(widthMm) || !Number.isFinite(lengthMm)) {
    throw new Error('Resposta inválida do servidor. Tente outra imagem.');
  }

  const status = computeStatus(heightMm, widthMm, lengthMm);
  return { heightMm, widthMm, lengthMm, status };
}


