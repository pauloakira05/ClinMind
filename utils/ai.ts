import { computeStatus, StatusText } from './measurements';

export interface AnalysisResult {
  heightMm: number;
  widthMm: number;
  lengthMm: number;
  status: StatusText;
}

// Placeholder AI analysis. Replace this with a real model integration later.
export async function analyzeImageFromDataUrl(dataUrl: string): Promise<AnalysisResult> {
  // Use a deterministic pseudo-random based on dataUrl length for stable demo values
  const seed = dataUrl.length;
  const rand = (min: number, max: number, s: number) => {
    const x = Math.abs(Math.sin(s)) % 1;
    return Math.round((min + x * (max - min)) * 10) / 10;
  };

  const heightMm = rand(8, 14, seed * 1.37);
  const widthMm = rand(18, 34, seed * 2.11);
  const lengthMm = rand(22, 38, seed * 3.03);
  const status = computeStatus(heightMm, widthMm, lengthMm);
  return { heightMm, widthMm, lengthMm, status };
}


