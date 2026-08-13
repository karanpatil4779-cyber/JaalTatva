import Papa from 'papaparse';
import type { ParseResult } from './types';
import { parseTabularRows, emptyResult } from './tabularParser';

export async function parseCSVFile(content: string, fileName: string): Promise<ParseResult> {
  try {
    const parsed = Papa.parse(content, {
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|'],
    });
    const rows: unknown[][] = (parsed.data || []).map(r =>
      Array.isArray(r) ? r : Object.values(r || {})
    );
    return parseTabularRows(rows, fileName, { methodPrefix: 'csv' });
  } catch (err) {
    return emptyResult(fileName, [
      `Could not read CSV file: ${err instanceof Error ? err.message : String(err)}`,
    ]);
  }
}
