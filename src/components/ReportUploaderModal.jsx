import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import {
  FileText, UploadCloud, Copy, Check, Sparkles, AlertCircle, FileSpreadsheet,
  CheckCircle2, ArrowRight, X, Info, Zap
} from 'lucide-react';
import {
  parseCSVReport,
  parseRawTextReport,
  parseAIJsonResponse,
  LAB_REPORT_AI_PROMPT,
  METAL_MAP
} from '../utils/labReportParser';
import { WHO_STANDARDS } from '../utils/hmpiEngine';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function ReportUploaderModal({ isOpen, onClose, onAutoFill }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'ai-prompt' | 'ai-json'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');
  
  // Parsed Result Preview State
  const [parsedData, setParsedData] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Extract text from PDF file using pdfjs-dist
  const extractTextFromPDF = async (arrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (err) {
      console.warn('PDFjs extraction fallback to basic text reader', err);
      return '';
    }
  };

  // Main File Handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setParsedData(null);

    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.csv')) {
        const content = await file.text();
        const res = await parseCSVReport(content);
        if (Object.keys(res.concentrations).length === 0) {
          throw new Error('No heavy metal parameters (As, Pb, Cd, Fe, Cr, Cu, etc.) found in CSV columns.');
        }
        setParsedData(res);
        setSuccessMsg(`Successfully extracted ${Object.keys(res.concentrations).length} metal parameters from CSV file!`);
      } 
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const res = await parseCSVReport(csvContent);
        if (Object.keys(res.concentrations).length === 0) {
          throw new Error('No heavy metal parameters found in Excel worksheet.');
        }
        setParsedData(res);
        setSuccessMsg(`Successfully parsed ${Object.keys(res.concentrations).length} metal concentrations from Excel worksheet!`);
      } 
      else if (fileName.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        let extractedText = await extractTextFromPDF(buffer);
        
        if (!extractedText || extractedText.trim().length < 10) {
          // If scanned image PDF with no embedded text stream
          throw new Error('This PDF appears to be a scanned image without selectable text. Please use the AI Assistant tab to paste the report for OCR extraction!');
        }

        const res = parseRawTextReport(extractedText);
        if (Object.keys(res.concentrations).length === 0) {
          throw new Error('Could not find heavy metal concentrations in text. Try copying the text into the AI Reader tab for advanced AI parsing.');
        }
        setParsedData(res);
        setSuccessMsg(`Directly parsed ${Object.keys(res.concentrations).length} heavy metal values from PDF report text!`);
      }
      else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const res = parseAIJsonResponse(text);
        setParsedData(res);
        setSuccessMsg('Successfully parsed JSON lab report data!');
      }
      else {
        // Plain text file (.txt)
        const text = await file.text();
        const res = parseRawTextReport(text);
        setParsedData(res);
        setSuccessMsg(`Extracted ${Object.keys(res.concentrations).length} metals from text file!`);
      }
    } catch (err) {
      setError(err.message || 'Error processing lab report file');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(LAB_REPORT_AI_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleParseAiJson = () => {
    if (!aiJsonInput.trim()) {
      setError('Please paste the JSON output from ChatGPT / Gemini response.');
      return;
    }
    setError(null);
    try {
      const res = parseAIJsonResponse(aiJsonInput);
      setParsedData(res);
      setSuccessMsg(`AI extracted ${Object.keys(res.concentrations).length} heavy metal concentrations successfully!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmAutoFill = () => {
    if (parsedData && onAutoFill) {
      onAutoFill(parsedData);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 780,
        maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid #cbd5e1',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeUp 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1.5px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          borderTopLeftRadius: 24, borderTopRightRadius: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}>
              <UploadCloud size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Auto-Fill Lab Report Reader
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>
                Directly read PDF, CSV, Excel or AI-assisted lab reports to auto-populate HMPI inputs
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '10px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 13,
              border: '1.5px solid', borderBottom: 'none', cursor: 'pointer',
              borderColor: activeTab === 'upload' ? '#2563eb' : 'transparent',
              background: activeTab === 'upload' ? '#ffffff' : 'transparent',
              color: activeTab === 'upload' ? '#2563eb' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            <FileSpreadsheet size={15} /> Direct File Upload (PDF/CSV/Excel)
          </button>

          <button
            onClick={() => setActiveTab('ai-prompt')}
            style={{
              padding: '10px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 13,
              border: '1.5px solid', borderBottom: 'none', cursor: 'pointer',
              borderColor: activeTab === 'ai-prompt' ? '#7c3aed' : 'transparent',
              background: activeTab === 'ai-prompt' ? '#ffffff' : 'transparent',
              color: activeTab === 'ai-prompt' ? '#7c3aed' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            <Sparkles size={15} /> AI Lab Report System Prompt
          </button>

          <button
            onClick={() => setActiveTab('ai-json')}
            style={{
              padding: '10px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 13,
              border: '1.5px solid', borderBottom: 'none', cursor: 'pointer',
              borderColor: activeTab === 'ai-json' ? '#0d9488' : 'transparent',
              background: activeTab === 'ai-json' ? '#ffffff' : 'transparent',
              color: activeTab === 'ai-json' ? '#0d9488' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
            <FileText size={15} /> Paste AI Response JSON
          </button>
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: 24 }}>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: '#991b1b', fontWeight: 600
            }}>
              <AlertCircle size={18} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: '#166534', fontWeight: 600
            }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD (PDF, CSV, XLSX) */}
          {activeTab === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files[0]);
                }}
                style={{
                  border: '2px dashed #bfdbfe', borderRadius: 18, background: '#f8fafc',
                  padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls,.txt,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
                />
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: '#eff6ff',
                  color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', border: '1.5px solid #bfdbfe'
                }}>
                  <UploadCloud size={28} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                  Drop your Lab Report file here or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>Browse</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', maxWidth: 460, margin: '0 auto' }}>
                  Supports <strong>PDF (.pdf)</strong>, <strong>CSV (.csv)</strong>, <strong>Excel (.xlsx / .xls)</strong>, and Text files. Automatically reads &amp; converts concentrations (ppb/µg/L to mg/L).
                </div>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#2563eb', fontWeight: 700, fontSize: 14 }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Extracting heavy metal data from lab report...
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI SYSTEM PROMPT */}
          {activeTab === 'ai-prompt' && (
            <div>
              <div style={{
                background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: 14,
                padding: '16px 20px', marginBottom: 18
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#6b21a8' }}>
                    <Sparkles size={16} /> Official AI Lab Report Extractor Prompt
                  </div>
                  <button onClick={handleCopyPrompt} style={{
                    background: copiedPrompt ? '#16a34a' : '#7c3aed', color: '#ffffff',
                    border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700,
                    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                    {copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}
                  </button>
                </div>
                <div style={{ fontSize: 12.5, color: '#581c87', lineHeight: 1.5 }}>
                  Copy this prompt and attach your lab report PDF/Image into <strong>ChatGPT</strong>, <strong>Google Gemini</strong>, or <strong>Claude</strong>. Then copy the JSON response and paste it into the "Paste AI Response JSON" tab!
                </div>
              </div>

              <textarea
                readOnly
                value={LAB_REPORT_AI_PROMPT}
                style={{
                  width: '100%', height: 220, borderRadius: 12, border: '1.5px solid #cbd5e1',
                  padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
                  background: '#0f172a', color: '#38bdf8', lineHeight: 1.6, resize: 'none'
                }}
              />
            </div>
          )}

          {/* TAB 3: PASTE AI RESPONSE JSON */}
          {activeTab === 'ai-json' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                Paste JSON Response from ChatGPT / Gemini / Claude:
              </div>
              <textarea
                rows={8}
                placeholder='Paste raw JSON here e.g. {"sampleInfo": {...}, "concentrations": {"As": 0.01, "Pb": 0.02...}}'
                value={aiJsonInput}
                onChange={(e) => setAiJsonInput(e.target.value)}
                style={{
                  width: '100%', borderRadius: 12, border: '1.5px solid #cbd5e1',
                  padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  background: '#f8fafc', color: '#0f172a', lineHeight: 1.5, marginBottom: 14
                }}
              />
              <button onClick={handleParseAiJson} className="btn btn-primary" style={{ background: '#0d9488', width: '100%' }}>
                <Zap size={16} /> Parse AI JSON &amp; Extract Values
              </button>
            </div>
          )}

          {/* PREVIEW & AUTO-FILL CONFIRMATION SECTION */}
          {parsedData && (
            <div style={{
              marginTop: 24, borderTop: '2px solid #e2e8f0', paddingTop: 20,
              animation: 'fadeUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={16} color="#2563eb" /> Extracted Sample Preview
                </div>
                <div style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 8, fontWeight: 700 }}>
                  {Object.keys(parsedData.concentrations).length} Metals Detected
                </div>
              </div>

              {/* Sample Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10,
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Sample ID</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parsedData.sampleInfo.id || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Location</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parsedData.sampleInfo.location || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Well Depth</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parsedData.sampleInfo.depth ? `${parsedData.sampleInfo.depth} m` : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Source Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parsedData.sampleInfo.source_type || 'Borewell'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parsedData.sampleInfo.date}</div>
                </div>
              </div>

              {/* Metal Concentrations Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                {Object.entries(parsedData.concentrations).map(([metal, val]) => {
                  const std = WHO_STANDARDS[metal];
                  const exceeded = std && val > std.limit;
                  return (
                    <div key={metal} style={{
                      background: exceeded ? '#fff5f5' : '#ffffff',
                      border: `1.5px solid ${exceeded ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '10px 12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 13, color: exceeded ? '#dc2626' : '#2563eb' }}>
                            {metal}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{std?.name}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: exceeded ? '#991b1b' : '#0f172a', marginTop: 2 }}>
                          {val} <span style={{ fontSize: 10, color: '#64748b' }}>mg/L</span>
                        </div>
                      </div>
                      {exceeded ? (
                        <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                          High
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                          OK
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Confirm Button */}
              <button
                onClick={handleConfirmAutoFill}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff', fontWeight: 800, fontSize: 15, border: 'none',
                  cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}>
                <Zap size={18} /> Auto-Fill Elements &amp; Calculate HMPI <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
