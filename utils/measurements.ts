export type StatusText = 'Padrão OK' | 'Atenção' | 'Fora do Padrão';

export interface StoredMeasurement {
  sampleId: string;
  heightMm: number;
  widthMm: number;
  lengthMm: number;
  status: StatusText;
  createdAt: string; // ISO string
}

const STORAGE_KEY = 'clinmind.measurements';
const DEFAULT_BASE_NUMBER = 4827;

export function getMeasurements(): StoredMeasurement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function setMeasurements(list: StoredMeasurement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function computeStatus(heightMm: number, widthMm: number, lengthMm: number): StatusText {
  const checkDim = (val: number, min: number, max: number): 'ok' | 'warn' | 'error' => {
    const within = val >= min && val <= max;
    if (within) return 'ok';
    const withinTen = val >= min * 0.9 && val <= max * 1.1;
    return withinTen ? 'warn' : 'error';
  };

  const h = checkDim(heightMm, 8, 12);
  const w = checkDim(widthMm, 20, 30);
  const l = checkDim(lengthMm, 25, 35);

  if (h === 'ok' && w === 'ok' && l === 'ok') return 'Padrão OK';
  const anyWarn = h === 'warn' || w === 'warn' || l === 'warn';
  const anyError = h === 'error' || w === 'error' || l === 'error';
  if (anyWarn && !anyError) return 'Atenção';
  return 'Fora do Padrão';
}

export function generateSampleId(existing?: string | null): string {
  const trimmed = (existing || '').trim();
  if (trimmed) return trimmed;

  const list = getMeasurements();
  const baseNumber = DEFAULT_BASE_NUMBER;
  const basePrefix = `${baseNumber}-`;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nextIndex = list.filter(m => m.sampleId.startsWith(basePrefix)).length;
  const letter = letters[nextIndex % letters.length];
  return `${basePrefix}${letter}`;
}

export function saveMeasurement(partial: {
  sampleId?: string | null;
  heightMm: number;
  widthMm: number;
  lengthMm: number;
}): StoredMeasurement {
  const sampleId = generateSampleId(partial.sampleId ?? null);
  const status = computeStatus(partial.heightMm, partial.widthMm, partial.lengthMm);
  const createdAt = new Date().toISOString();
  const measurement: StoredMeasurement = {
    sampleId,
    heightMm: partial.heightMm,
    widthMm: partial.widthMm,
    lengthMm: partial.lengthMm,
    status,
    createdAt,
  };

  const list = getMeasurements();
  list.push(measurement);
  setMeasurements(list);
  return measurement;
}

export function deleteMeasurementById(sampleId: string, createdAt: string): void {
  const list = getMeasurements();
  const next = list.filter(m => !(m.sampleId === sampleId && m.createdAt === createdAt));
  setMeasurements(next);
}

export function formatDateTimePtBR(iso: string): { date: string; time: string; full: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR');
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time, full: `${date} ${time}` };
}


