export interface ParsedElement {
  symbol: string;
  value: number;
  unit: string;
  converted: boolean;
  confidence: number;
  method: string;
  note?: string;
}

export interface SampleInfo {
  id?: string;
  location?: string;
  depth?: string;
  source_type?: string;
  date?: string;
}

export interface ParseResult {
  fileName: string;
  elements: ParsedElement[];
  sampleInfo: SampleInfo;
  summary: {
    found: number;
    total: number;
    convertedUnits: string[];
    methods: string[];
    scannedPdf?: boolean;
  };
  warnings: string[];
}
