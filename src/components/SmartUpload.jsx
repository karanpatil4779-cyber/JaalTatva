import { useRef, useState } from 'react';
import {
  UploadCloud, FileText, FileSpreadsheet, Check, X, AlertTriangle, Sparkles,
  ArrowRight, RefreshCw, Loader2, Info,
} from 'lucide-react';
import { ACCEPTED_EXTENSIONS } from '../lib/parsers/supported';
import { WHO_STANDARDS, METAL_COLORS } from '../utils/hmpiEngine';

const ACCEPT = '.pdf,.csv,.xlsx,.xls';

function confidenceColor(c) {
  if (c >= 0.9) return '#10b981';
  if (c >= 0.75) return '#f59e0b';
  return '#f43f5e';
}

export default function SmartUpload({ onApply }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const isSupported = ACCEPTED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!isSupported) {
      setError(`Unsupported file type "${file.name}". Please upload PDF, CSV, XLSX or XLS.`);
      setResult(null);
      setFileName('');
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);
    setBusy(true);
    setProgress(20);

    const steps = [35, 55, 75];
    let si = 0;
    const timer = setInterval(() => {
      setProgress(steps[Math.min(si++, steps.length - 1)]);
    }, 320);

    try {
      const { parseLabFile: runParser } = await import('../lib/parsers');
      const res = await runParser(file);
      clearInterval(timer);
      setProgress(100);
      setResult(res);
      setTimeout(() => setProgress(0), 700);
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      setError(err?.message || 'Could not parse the file. Please try another format.');
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => {
    setResult(null);
    setError(null);
    setFileName('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const missingMetals = result
    ? Object.keys(WHO_STANDARDS).filter(
        m => !result.elements.some(e => e.symbol === m)
      )
    : [];

  return (
    <div className="card mb-24" style={{ border: '1.5px solid #dce4ef', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-blue)' }}>
          <Sparkles size={19} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            Smart Upload — Auto-fill from Lab Report
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Upload PDF, CSV or Excel and the form auto-fills. Review &amp; edit before computing.
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#bfdbfe'}`,
          background: dragOver ? '#eff6ff' : '#f8fafc',
          borderRadius: 16, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => e.target.files?.length && handleFile(e.target.files[0])}
        />
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: '#eff6ff', color: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          border: '1.5px solid #bfdbfe',
        }}>
          <UploadCloud size={24} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1e293b' }}>
          Drop your lab report here or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>browse files</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Supports <strong>.pdf</strong>, <strong>.csv</strong>, <strong>.xlsx</strong> / <strong>.xls</strong> · µg/L &amp; ppb auto-converted to mg/L
        </div>
      </div>

      {/* Parsing / progress */}
      {busy && (
        <div style={{ marginTop: 16, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Parsing file<span>"{fileName}"</span> — detecting element names, values &amp; units…
          </div>
          <div className="progress-bar" style={{ height: 8, background: '#e2e8f0' }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', transition: 'width 0.35s ease' }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !busy && (
        <div className="alert alert-danger" style={{ marginTop: 16, marginBottom: 0, animation: 'fadeUp 0.3s ease' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800 }}>Upload failed</div>
            <div style={{ fontSize: 12.5 }}>{error}</div>
          </div>
          <button onClick={clearAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9f1239' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Result preview */}
      {result && !busy && (
        <div style={{ marginTop: 16, borderTop: '2px solid #e2e8f0', paddingTop: 16, animation: 'fadeUp 0.4s ease' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={16} color="#2563eb" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{result.fileName}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  {result.elements.length} of {result.summary.total} parameters detected
                  {result.summary.convertedUnits.length > 0 && ` · converted ${result.summary.convertedUnits.join(', ')} → mg/L`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          </div>

          {/* Scanned PDF notice */}
          {result.summary.scannedPdf && (
            <div className="alert alert-warning" style={{ marginBottom: 12 }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>{result.warnings[0] || 'Scanned PDF detected.'}</div>
            </div>
          )}

          {/* No elements found */}
          {result.elements.length === 0 && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800 }}>No recognizable heavy metal parameters found</div>
                <div style={{ fontSize: 12.5 }}>
                  {result.warnings[0] || 'Check the file format, or enter the values manually using the form below.'}
                </div>
              </div>
            </div>
          )}

          {/* Elements grid */}
          {result.elements.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
                {result.elements.map(e => {
                  const std = WHO_STANDARDS[e.symbol];
                  const color = METAL_COLORS[e.symbol] || '#2563eb';
                  const exceeded = std && e.value > std.limit;
                  return (
                    <div key={e.symbol} style={{
                      border: `1.5px solid ${exceeded ? '#fca5a5' : '#e2e8f0'}`,
                      background: exceeded ? '#fff5f5' : '#ffffff',
                      borderRadius: 12, padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 13,
                            color, background: color + '15', padding: '2px 8px', borderRadius: 6,
                          }}>{e.symbol}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{std?.name}</span>
                        </span>
                        <span title="Auto-filled from upload" style={{
                          fontSize: 9, fontWeight: 800, color: '#0d9488', background: '#f0fdfa',
                          border: '1px solid #99f6e4', padding: '1px 6px', borderRadius: 6, letterSpacing: 0.3, whiteSpace: 'nowrap',
                        }}>from upload</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: exceeded ? '#991b1b' : '#0f172a', fontFamily: 'JetBrains Mono' }}>
                          {e.value} <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>mg/L</span>
                        </span>
                        {exceeded && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: 6 }}>
                            Exceeds WHO
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                        <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 999 }}>
                          <div style={{ height: '100%', width: `${e.confidence * 100}%`, background: confidenceColor(e.confidence), borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
                          {Math.round(e.confidence * 100)}% {e.converted ? `· from ${e.unit}` : `· ${e.unit}`}
                        </span>
                      </div>
                      {e.note && <div style={{ fontSize: 10, color: '#d97706', marginTop: 4 }}>{e.note}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Missing params */}
              {missingMetals.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e' }}>
                  <strong>{missingMetals.length} parameter(s) not found in this report</strong> (will be left blank for manual entry):{' '}
                  {missingMetals.map((m, i) => (
                    <span key={m} style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, marginRight: 8 }}>
                      {m}{i < missingMetals.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Apply */}
              <button onClick={() => onApply(result)} className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
                <FileSpreadsheet size={16} /> Apply {result.elements.length} values to Calculator Form <ArrowRight size={15} />
              </button>
              <div style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                Nothing is computed until you press <strong>Compute All Indices</strong> — review the fields first.
              </div>
            </>
          )}
        </div>
      )}

      {!busy && !error && !result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#94a3b8', marginTop: 14 }}>
          <Check size={13} color="#10b981" /> Manual entry still works exactly as before — this is optional.
        </div>
      )}
    </div>
  );
}
