import type { ParsedElement, ParseResult, SampleInfo } from './types';
import {
  matchElement,
  detectUnit,
  parseNumericValue,
  extractSampleInfo,
  infoFromWideRow,
} from './elementDictionary';

export interface TabularOptions {
  methodPrefix?: string;
}

const VALUE_HEADER_RE =
  /^(result|value|concentration|observed|reading|amount|level|quantity)$/i;
const UNIT_HEADER_RE = /^(unit|units|uom)$/i;
const UNIT_WORD_RE = /(?:µg|μg|ug|microgram|mcg|mg|ng|g)\s*\/?\s*l|ppb|ppt|ppm/i;

interface HeaderClass {
  index: number;
  elementCols: number[];
  valueCols: number[];
  unitCols: number[];
  score: number;
}

function classifyRow(row: unknown[]): Omit<HeaderClass, 'index'> {
  const elementCols: number[] = [];
  const valueCols: number[] = [];
  const unitCols: number[] = [];
  row.forEach((cell, i) => {
    const s = String(cell ?? '').trim();
    if (!s) return;
    if (matchElement(s)) elementCols.push(i);
    if (VALUE_HEADER_RE.test(s) || UNIT_WORD_RE.test(s)) valueCols.push(i);
    if (UNIT_HEADER_RE.test(s)) unitCols.push(i);
  });
  return { elementCols, valueCols, unitCols, score: elementCols.length * 2 + valueCols.length };
}

function numericCellCount(row: unknown[]): number {
  return row.filter(cell => parseNumericValue(cell) !== null).length;
}

function findHeaderRow(rows: unknown[][]): HeaderClass {
  const scan = rows.slice(0, Math.min(20, rows.length));
  let best: HeaderClass | null = null;
  scan.forEach((row, idx) => {
    const cls = classifyRow(row);
    cls.score -= numericCellCount(row) * 5;
    if (!best || cls.score > best.score) best = { index: idx, ...cls };
  });
  return (
    best || { index: 0, elementCols: [], valueCols: [], unitCols: [], score: 0 }
  );
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function emptyResult(fileName: string, warnings: string[] = []): ParseResult {
  return {
    fileName,
    elements: [],
    sampleInfo: {},
    summary: { found: 0, total: 12, convertedUnits: [], methods: [] },
    warnings,
  };
}

export function parseTabularRows(
  rows: unknown[][],
  fileName: string,
  opts: TabularOptions = {}
): ParseResult {
  const methodPrefix = opts.methodPrefix || 'table';
  const found = new Map<string, ParsedElement>();
  const convertedUnits = new Set<string>();
  const methods = new Set<string>();

  if (!rows || rows.length === 0) {
    return emptyResult(fileName, ['Table appears to be empty.']);
  }

  const addElement = (el: ParsedElement) => {
    const existing = found.get(el.symbol);
    if (!existing || el.confidence > existing.confidence) found.set(el.symbol, el);
  };

  const header = findHeaderRow(rows);
  const headerRow = rows[header.index] || [];
  const dataStart = header.index + 1;
  const dataRows = rows.slice(dataStart);
  const metaRows = rows.slice(0, dataStart);

  // Approach A: per-column detection — header cell contains the element name/symbol.
  headerRow.forEach((cell, colIdx) => {
    const entry = matchElement(cell);
    if (!entry) return;
    const unit = detectUnit(cell);
    let hasValue = false;
    dataRows.forEach(row => {
      const parsed = parseNumericValue(row[colIdx]);
      if (!parsed) return;
      hasValue = true;
      const value = parsed.value * unit.factor;
      if (unit.factor !== 1) convertedUnits.add(unit.label);
      addElement({
        symbol: entry.symbol,
        value: round(value),
        unit: unit.factor !== 1 ? 'mg/L' : unit.label,
        converted: unit.factor !== 1,
        confidence: 0.95,
        method: `${methodPrefix}:column-header`,
        note: parsed.note,
      });
    });
    if (hasValue) methods.add('column-header');
  });

  const globalElementCol = header.elementCols.length ? header.elementCols[0] : -1;
  const globalValueCol = header.valueCols.length ? header.valueCols[0] : -1;
  const globalUnitCol = header.unitCols.length ? header.unitCols[0] : -1;
  const headerFallbackUnit =
    globalValueCol >= 0 && UNIT_WORD_RE.test(String(headerRow[globalValueCol] ?? ''))
      ? detectUnit(headerRow[globalValueCol])
      : null;

  // Approach B: row-based — element name column paired with a value column.
  dataRows.forEach(row => {
    let processed = false;
    if (globalElementCol >= 0) {
      const entry = matchElement(row[globalElementCol]);
      const valIdx =
        globalValueCol >= 0
          ? globalValueCol
          : globalUnitCol >= 0
            ? globalUnitCol - 1
            : -1;
      if (entry && valIdx >= 0) {
        const parsed = parseNumericValue(row[valIdx]);
        if (parsed) {
          let unitInfo = detectUnit(headerRow[globalValueCol >= 0 ? globalValueCol : valIdx]);
          const inline = detectUnit(row[valIdx]);
          const inlinePresent = UNIT_WORD_RE.test(String(row[valIdx] ?? ''));
          let factor = inlinePresent ? inline.factor : unitInfo.factor;
          let label = inlinePresent ? inline.label : unitInfo.label;
          if (globalUnitCol >= 0) {
            const unitCell = String(row[globalUnitCol] ?? '').trim();
            if (unitCell && UNIT_WORD_RE.test(unitCell)) {
              unitInfo = detectUnit(unitCell);
              if (!inlinePresent) {
                factor = unitInfo.factor;
                label = unitInfo.label;
              }
            }
          }
          const value = parsed.value * factor;
          if (factor !== 1) convertedUnits.add(label);
          addElement({
            symbol: entry.symbol,
            value: round(value),
            unit: factor !== 1 ? 'mg/L' : label,
            converted: factor !== 1,
            confidence: 0.85,
            method: `${methodPrefix}:row`,
            note: parsed.note,
          });
          methods.add('row');
          processed = true;
        }
      }
    }

    // Approach C: generic same-row pairs (element token followed by numeric token).
    if (!processed) {
      for (let i = 0; i < row.length - 1; i++) {
        const entry = matchElement(row[i]);
        if (!entry) continue;
        const parsed = parseNumericValue(row[i + 1]);
        if (!parsed) continue;
        let unitInfo = detectUnit(row[i]);
        let label = unitInfo.label;
        if (UNIT_WORD_RE.test(String(row[i + 1] ?? ''))) {
          unitInfo = detectUnit(row[i + 1]);
          label = unitInfo.label;
        } else if (i + 2 < row.length && UNIT_WORD_RE.test(String(row[i + 2] ?? ''))) {
          unitInfo = detectUnit(row[i + 2]);
          label = unitInfo.label;
        } else if (headerFallbackUnit) {
          unitInfo = headerFallbackUnit;
          label = unitInfo.label;
        }
        const value = parsed.value * unitInfo.factor;
        if (unitInfo.factor !== 1) convertedUnits.add(label);
        addElement({
          symbol: entry.symbol,
          value: round(value),
          unit: unitInfo.factor !== 1 ? 'mg/L' : label,
          converted: unitInfo.factor !== 1,
          confidence: 0.7,
          method: `${methodPrefix}:pair`,
          note: parsed.note,
        });
        methods.add('pair');
      }
    }
  });

  const sampleInfo: SampleInfo = {
    ...extractSampleInfo(metaRows),
    ...infoFromWideRow(headerRow, dataRows[0] || []),
  };

  const elements = Array.from(found.values());
  return {
    fileName,
    elements,
    sampleInfo,
    summary: {
      found: elements.length,
      total: 12,
      convertedUnits: Array.from(convertedUnits),
      methods: Array.from(methods),
    },
    warnings: [],
  };
}
