import Papa from 'papaparse';

/**
 * Heavy Metal mapping dictionaries for matching lab report names & chemical symbols
 */
export const METAL_MAP = {
  arsenic: 'As', as: 'As',
  cadmium: 'Cd', cd: 'Cd',
  chromium: 'Cr', cr: 'Cr',
  copper: 'Cu', cu: 'Cu',
  iron: 'Fe', fe: 'Fe',
  manganese: 'Mn', mn: 'Mn',
  nickel: 'Ni', ni: 'Ni',
  lead: 'Pb', pb: 'Pb',
  zinc: 'Zn', zn: 'Zn',
  mercury: 'Hg', hg: 'Hg',
  selenium: 'Se', se: 'Se',
  cobalt: 'Co', co: 'Co',
};

/**
 * System AI Prompt for parsing PDF lab reports / scanned images using LLM (Gemini, ChatGPT, Claude)
 */
export const LAB_REPORT_AI_PROMPT = `You are a Groundwater Quality & Heavy Metal Lab Analysis Assistant.
Examine the attached water sample lab test report (PDF/Image/Text) and extract the heavy metal concentrations, sample metadata, and units.

CRITICAL INSTRUCTIONS:
1. Extract numerical values for heavy metals: As (Arsenic), Cd (Cadmium), Cr (Chromium), Cu (Copper), Fe (Iron), Mn (Manganese), Ni (Nickel), Pb (Lead), Zn (Zinc), Hg (Mercury), Se (Selenium), Co (Cobalt).
2. CONVERT ALL CONCENTRATION VALUES TO mg/L (ppm):
   - If value is in ug/L, µg/L, or ppb -> Divide by 1000 to convert to mg/L (e.g., 10 µg/L = 0.01 mg/L).
   - If value is in mg/L or ppm -> Keep as is.
   - If BDL (Below Detection Limit), ND (Not Detected), or <0.001 -> Set value to 0.0001 or equivalent low decimal.
3. Extract sample metadata: Sample ID, Location/Station, Well Depth (in meters), Source Type (Borewell/Handpump/Open Well/Spring/River), and Collection Date (YYYY-MM-DD).

Return ONLY valid raw JSON with no Markdown formatting or surrounding text:
{
  "sampleInfo": {
    "id": "Sample/Lab ID or GW-001",
    "location": "City/Station Name or Location",
    "depth": "Depth in meters or empty string",
    "source_type": "Borewell",
    "date": "YYYY-MM-DD"
  },
  "concentrations": {
    "As": 0.01,
    "Pb": 0.02,
    "Fe": 0.35,
    "Cd": 0.002,
    "Cr": 0.04,
    "Cu": 0.15,
    "Mn": 0.25,
    "Zn": 1.20,
    "Ni": 0.01,
    "Hg": 0.0005,
    "Se": 0.005,
    "Co": 0.01
  },
  "detected_units": "mg/L (converted)",
  "raw_notes": "Extracted from CGWB NABL accredited lab report"
}`;

/**
 * Parses raw text extracted from PDF or text file
 */
export function parseRawTextReport(text) {
  const concentrations = {};
  const sampleInfo = {
    id: '',
    location: '',
    depth: '',
    source_type: 'Borewell',
    date: new Date().toISOString().split('T')[0],
  };

  // Try extracting Sample ID
  const idMatch = text.match(/(?:sample\s*id|lab\s*code|sample\s*no|report\s*no)[:\s]+([A-Z0-9_-]+)/i);
  if (idMatch) sampleInfo.id = idMatch[1].trim();

  // Try extracting Location
  const locMatch = text.match(/(?:location|station|site|address|district|place)[:\s]+([^\n,]+)/i);
  if (locMatch) sampleInfo.location = locMatch[1].trim();

  // Try extracting Depth
  const depthMatch = text.match(/(?:depth|well\s*depth)[:\s]+(\d+(?:\.\d+)?)\s*(?:m|meters|ft)?/i);
  if (depthMatch) sampleInfo.depth = depthMatch[1];

  // Try extracting Date
  const dateMatch = text.match(/\b(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/);
  if (dateMatch) {
    const rawDate = dateMatch[1];
    if (rawDate.includes('-') && rawDate.length === 10 && rawDate.indexOf('-') === 4) {
      sampleInfo.date = rawDate;
    }
  }

  // Detect default unit modifier in text (e.g. ug/L or ppb)
  const isMicrogramDefault = /\b(ug\/l|µg\/l|ppb)\b/i.test(text);

  // Line-by-line or regex search for metals
  const lines = text.split('\n');

  lines.forEach(line => {
    const cleanLine = line.toLowerCase();
    Object.entries(METAL_MAP).forEach(([key, symbol]) => {
      // Avoid duplicate matching if symbol already extracted
      if (concentrations[symbol]) return;

      // Regex pattern to capture metal name/symbol followed by numbers
      const regex = new RegExp(`\\b(?:${key})\\b[^0-9.<>]*([<>]?\\s*\\d+(?:\\.\\d+)?)`, 'i');
      const match = cleanLine.match(regex);
      if (match) {
        let valStr = match[1].replace(/[<>]/g, '').trim();
        let numVal = parseFloat(valStr);

        if (!isNaN(numVal)) {
          // Check unit on line
          const isMicro = /\b(ug\/l|µg\/l|ppb)\b/i.test(line) || isMicrogramDefault;
          if (isMicro) {
            numVal = numVal / 1000; // Convert ppb or ug/L to mg/L
          }
          concentrations[symbol] = parseFloat(numVal.toFixed(6));
        }
      }
    });
  });

  return { sampleInfo, concentrations };
}

/**
 * Parses CSV files containing heavy metal concentrations and sample metadata
 */
export function parseCSVReport(fileContent) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV file is empty or formatted incorrectly'));
        }

        const sample = results.data[0];
        const concentrations = {};
        const sampleInfo = {
          id: sample.id || sample.sample_id || sample.SampleID || `GW-${Date.now().toString().slice(-4)}`,
          location: sample.location || sample.Location || sample.Station || 'Uploaded Sample',
          depth: sample.depth || sample.Depth || '',
          source_type: sample.source_type || sample.Source || 'Borewell',
          date: sample.date || sample.Date || new Date().toISOString().split('T')[0],
        };

        // Extract metals from CSV headers / columns
        Object.keys(sample).forEach(key => {
          const lowerKey = key.trim().toLowerCase();
          const symbol = METAL_MAP[lowerKey];
          if (symbol) {
            let rawVal = String(sample[key]).trim();
            // Handle BDL / ND
            if (/bdl|nd|<|not detected/i.test(rawVal)) {
              concentrations[symbol] = 0.0001;
            } else {
              let num = parseFloat(rawVal);
              if (!isNaN(num)) {
                // If header indicates ug/L or ppb
                if (/ug\/l|µg\/l|ppb/i.test(key)) num = num / 1000;
                concentrations[symbol] = parseFloat(num.toFixed(6));
              }
            }
          }
        });

        resolve({ sampleInfo, concentrations, allRows: results.data });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Validates and normalizes AI JSON response
 */
export function parseAIJsonResponse(jsonText) {
  try {
    // Strip code fences if present
    const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    const concentrations = {};
    if (data.concentrations) {
      Object.entries(data.concentrations).forEach(([k, v]) => {
        const symbol = METAL_MAP[k.toLowerCase()] || (METAL_MAP[k] ? k : null);
        if (symbol) {
          let num = parseFloat(v);
          if (!isNaN(num) && num >= 0) concentrations[symbol] = num;
        }
      });
    }

    const sampleInfo = {
      id: data.sampleInfo?.id || `GW-${Date.now().toString().slice(-4)}`,
      location: data.sampleInfo?.location || 'AI Extracted Sample',
      depth: data.sampleInfo?.depth || '',
      source_type: data.sampleInfo?.source_type || 'Borewell',
      date: data.sampleInfo?.date || new Date().toISOString().split('T')[0],
    };

    return { sampleInfo, concentrations, rawNotes: data.raw_notes || 'Extracted via AI Prompt' };
  } catch (err) {
    throw new Error('Invalid JSON format. Please make sure to paste the exact raw JSON output from the AI response.');
  }
}
