import * as XLSX from 'xlsx';
import type { ParseResult } from './types';
import { parseTabularRows, emptyResult } from './tabularParser';

export async function parseExcelFile(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    let best: ParseResult | null = null;
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
      const res = parseTabularRows(rows, fileName, { methodPrefix: `xlsx` });
      if (res.elements.length > (best?.elements.length || 0)) best = res;
    }
    return best || emptyResult(fileName, ['No data found in Excel workbook.']);
  } catch (err) {
    return emptyResult(fileName, [
      `Could not read Excel file: ${err instanceof Error ? err.message : String(err)}`,
    ]);
  }
}
