import type { ParseResult } from './types';
import { parseCSVFile } from './csvParser';
import { parseExcelFile } from './xlsxParser';
import { parsePDFFile } from './pdfParser';
import { ACCEPTED_EXTENSIONS } from './supported';

export { ACCEPTED_EXTENSIONS };

export class UnsupportedFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFileError';
  }
}

export async function parseLabFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';

  if (ext === '.pdf') return parsePDFFile(await file.arrayBuffer(), file.name);
  if (ext === '.csv') return parseCSVFile(await file.text(), file.name);
  if (ext === '.xlsx' || ext === '.xls') return parseExcelFile(await file.arrayBuffer(), file.name);

  throw new UnsupportedFileError(
    `Unsupported file type "${ext || '(none)'}". Please upload PDF, CSV, XLSX or XLS.`
  );
}

export type { ParseResult, ParsedElement, SampleInfo } from './types';
