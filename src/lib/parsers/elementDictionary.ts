import type { SampleInfo } from './types';

export interface ElementEntry {
  symbol: string;
  name: string;
}

export const ELEMENT_DICTIONARY: ElementEntry[] = [
  { symbol: 'As', name: 'arsenic' },
  { symbol: 'Cd', name: 'cadmium' },
  { symbol: 'Cr', name: 'chromium' },
  { symbol: 'Cu', name: 'copper' },
  { symbol: 'Fe', name: 'iron' },
  { symbol: 'Mn', name: 'manganese' },
  { symbol: 'Ni', name: 'nickel' },
  { symbol: 'Pb', name: 'lead' },
  { symbol: 'Zn', name: 'zinc' },
  { symbol: 'Hg', name: 'mercury' },
  { symbol: 'Se', name: 'selenium' },
  { symbol: 'Co', name: 'cobalt' },
];

export const KNOWN_SYMBOLS: string[] = ELEMENT_DICTIONARY.map(e => e.symbol);
export const KNOWN_NAMES: string[] = ELEMENT_DICTIONARY.map(e => e.name);

export function normalizeToken(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, '');
}

export function matchElement(raw: unknown): ElementEntry | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  const norm = normalizeToken(s);
  if (!norm || norm.length < 2) return null;

  for (const e of ELEMENT_DICTIONARY) {
    if (e.symbol.toLowerCase() === norm) return e;
  }
  for (const e of ELEMENT_DICTIONARY) {
    if (s.includes(e.name)) return e;
  }
  for (const token of s.split(/[\s\-_()/:]+/)) {
    const tn = token.replace(/[^a-z]/g, '');
    if (!tn || tn.length < 2) continue;
    for (const e of ELEMENT_DICTIONARY) {
      if (e.symbol.toLowerCase() === tn) return e;
      if (tn === e.name) return e;
      if (tn.length >= 3 && e.name.includes(tn)) return e;
    }
  }
  return null;
}

export interface UnitInfo {
  factor: number;
  label: string;
}

export function detectUnit(raw: unknown): UnitInfo {
  const s = String(raw ?? '').toLowerCase();
  if (/(?:µg|μg|ug|microgram|mcg)\s*\/?\s*l|ppb/.test(s)) return { factor: 0.001, label: 'µg/L' };
  if (/ng\s*\/?\s*l|ppt/.test(s)) return { factor: 0.000001, label: 'ng/L' };
  if (/mg\s*\/?\s*l|ppm/.test(s)) return { factor: 1, label: 'mg/L' };
  if (/g\s*\/?\s*l/.test(s)) return { factor: 1000, label: 'g/L' };
  return { factor: 1, label: 'mg/L' };
}

export interface NumericValue {
  value: number;
  imputed: boolean;
  note?: string;
}

export function parseNumericValue(raw: unknown): NumericValue | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();

  const nonDetect =
    /\b(bdl|below\s*detection|not\s*detected|nd)\b/.test(lower) || /^[<>]\s*\d/.test(s);
  if (nonDetect) {
    const m = s.match(/(\d+(?:\.\d+)?)/);
    return {
      value: m ? parseFloat(m[1]) * 0.1 : 0.0001,
      imputed: true,
      note: 'Below detection limit - imputed value',
    };
  }

  const m = s.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  return { value: parseFloat(m[0]), imputed: false };
}

const KEY_TO_FIELD: Record<string, keyof SampleInfo> = {
  id: 'id',
  sampleid: 'id',
  sample_id: 'id',
  sampleno: 'id',
  'sample no': 'id',
  labcode: 'id',
  labno: 'id',
  reportno: 'id',
  report_no: 'id',
  location: 'location',
  station: 'location',
  site: 'location',
  district: 'location',
  place: 'location',
  address: 'location',
  depth: 'depth',
  welldepth: 'depth',
  'well depth': 'depth',
  depthm: 'depth',
  sourcetype: 'source_type',
  source: 'source_type',
  'source type': 'source_type',
  date: 'date',
  collectiondate: 'date',
  sampledate: 'date',
  'collection date': 'date',
  'sample date': 'date',
};

const VALUE_LOOKS_OK = (val: string) =>
  !!val && val.toLowerCase() !== 'na' && val.toLowerCase() !== 'n/a';

export function infoFromWideRow(headerRow: unknown[], dataRow: unknown[]): SampleInfo {
  const info: SampleInfo = {};
  headerRow.forEach((h, i) => {
    const key = normalizeToken(String(h));
    const target = KEY_TO_FIELD[key];
    if (!target || info[target]) return;
    const val = String(dataRow[i] ?? '').trim();
    if (VALUE_LOOKS_OK(val)) (info as unknown as Record<string, string>)[target] = val;
  });
  return info;
}

export function extractSampleInfo(rows: unknown[][]): SampleInfo {
  const info: SampleInfo = {};
  for (const row of rows) {
    if (!row || row.length < 2) continue;
    if (row.some(cell => matchElement(cell))) continue;
    for (let i = 0; i < row.length - 1; i++) {
      const key = normalizeToken(String(row[i]));
      if (!key) continue;
      const target = KEY_TO_FIELD[key] || (key.includes('depth') ? 'depth' : null);
      if (!target || info[target]) continue;
      const val = String(row[i + 1]).trim();
      if (VALUE_LOOKS_OK(val)) (info as unknown as Record<string, string>)[target] = val;
    }
  }
  return info;
}
