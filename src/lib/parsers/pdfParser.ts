import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ParsedElement, ParseResult } from './types';
import {
  ELEMENT_DICTIONARY,
  detectUnit,
  parseNumericValue,
  extractSampleInfo,
} from './elementDictionary';
import { parseTabularRows } from './tabularParser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let line = '';
    let lastY: number | null = null;
    let lastX: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const str = item.str;
      if (!str) continue;
      const y = item.transform[5];
      const x = item.transform[4];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (line.trim()) text += line.trim() + '\n';
        line = str;
      } else {
        if (line && lastX !== null && x - lastX > 4) line += ' ' + str;
        else line += str;
      }
      lastY = y;
      lastX = x;
    }
    if (line.trim()) text += line.trim() + '\n';
  }
  return text;
}

function splitLine(line: string): string[] {
  const parts = line
    .split(/\s{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : line.split(/\s+/).filter(Boolean);
}

const UNIT_CAPTURE = /\s*\(?\s*([a-zµ]+\/?[a-z]*)?\s*\)?$/i;

function regexExtract(text: string, fileName: string): ParseResult {
  const found = new Map<string, ParsedElement>();
  const convertedUnits = new Set<string>();
  const methods = new Set<string>();
  const globalUnit = detectUnit(text);
  const lines = text.split('\n');

  const tryAdd = (
    entry: { symbol: string; name: string },
    rawValue: string,
    rawUnit: string,
    baseConfidence: number
  ) => {
    if (found.has(entry.symbol)) return;
    const parsed = parseNumericValue(rawValue);
    if (!parsed) return;
    const explicit = rawUnit && /(?:µg|μg|ug|microgram|mcg|mg|ng|g)\s*\/?\s*l|ppb|ppt|ppm/i.test(rawUnit);
    const unitInfo = explicit ? detectUnit(rawUnit) : globalUnit.factor !== 1 ? globalUnit : detectUnit('mg/L');
    const value = parsed.value * unitInfo.factor;
    const confidence = explicit ? baseConfidence : globalUnit.factor !== 1 ? baseConfidence - 0.1 : baseConfidence - 0.15;
    if (unitInfo.factor !== 1) convertedUnits.add(unitInfo.label);
    found.set(entry.symbol, {
      symbol: entry.symbol,
      value: Math.round(value * 1e6) / 1e6,
      unit: unitInfo.factor !== 1 ? 'mg/L' : unitInfo.label,
      converted: unitInfo.factor !== 1,
      confidence: Math.max(0.5, confidence),
      method: 'pdf:regex',
      note: parsed.note,
    });
    methods.add('regex');
  };

  for (const line of lines) {
    for (const e of ELEMENT_DICTIONARY) {
      if (found.has(e.symbol)) continue;
      const nameRe = new RegExp(
        `\\b${e.name}\\b[^0-9<>]*([<>]?\\s*\\d+(?:\\.\\d+)?)${UNIT_CAPTURE.source}`,
        'i'
      );
      const m = line.match(nameRe);
      if (m) {
        tryAdd(e, m[1], m[2] || '', 0.85);
        continue;
      }
      const symRe = new RegExp(
        `[<(]?\\b${e.symbol}\\b[)>]?[^0-9<>]{0,24}?([<>]?\\s*\\d+(?:\\.\\d+)?)${UNIT_CAPTURE.source}`,
        'i'
      );
      const sm = line.match(symRe);
      if (sm) tryAdd(e, sm[1], sm[2] || '', 0.8);
    }
  }

  const elements = Array.from(found.values());
  const rows = lines.map(splitLine);
  return {
    fileName,
    elements,
    sampleInfo: extractSampleInfo(rows),
    summary: {
      found: elements.length,
      total: 12,
      convertedUnits: Array.from(convertedUnits),
      methods: Array.from(methods),
    },
    warnings: [],
  };
}

export async function parsePDFFile(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  const text = await extractPdfText(buffer);
  if (text.replace(/\s+/g, '').length < 20) {
    return {
      fileName,
      elements: [],
      sampleInfo: {},
      summary: { found: 0, total: 12, convertedUnits: [], methods: [], scannedPdf: true },
      warnings: [
        'This PDF appears to be a scanned image without selectable text. OCR is not supported yet - please enter the values manually or upload a text-based PDF.',
      ],
    };
  }

  const rows = text
    .split('\n')
    .filter(l => l.trim())
    .map(splitLine);

  const tabular = parseTabularRows(rows, fileName, { methodPrefix: 'pdf' });
  if (tabular.elements.length > 0) {
    return { ...tabular, summary: { ...tabular.summary, scannedPdf: false } };
  }

  const regex = regexExtract(text, fileName);
  if (regex.elements.length > 0) {
    return { ...regex, summary: { ...regex.summary, scannedPdf: false } };
  }

  return {
    ...regex,
    warnings: [
      'Could not identify heavy metal concentrations in this PDF. Check that element names and numeric values are present, or enter the values manually.',
    ],
  };
}
