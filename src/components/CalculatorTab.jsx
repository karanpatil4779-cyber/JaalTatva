import { useState } from 'react';
import { WHO_STANDARDS, METAL_COLORS, MOCK_SAMPLES, runFullAnalysis } from '../utils/hmpiEngine';
import { generateHMPIPdfReport } from '../utils/pdfGenerator';
import { MetalProgressBar, HMPIGauge, FormulaCard } from './SharedComponents';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid
} from 'recharts';
import { Beaker, FlaskConical, Plus, Zap, AlertTriangle, ArrowRight, RefreshCw, Sparkles, FileDown } from 'lucide-react';

const METALS = Object.keys(WHO_STANDARDS);

const STATUS = { safe: { label: 'Safe', badge: 'badge-safe' }, moderate: { label: 'Moderate Risk', badge: 'badge-moderate' }, high: { label: 'High Risk', badge: 'badge-high' }, critical: { label: 'Critical', badge: 'badge-critical' } };
const CLASS_COLORS = { safe: '#10b981', moderate: '#f59e0b', high: '#f97316', critical: '#dc2626' };

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 14, fontWeight: 700, color: p.fill || '#2563eb' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </div>
      ))}
    </div>
  );
};

function MetalToggle({ metal, active, onToggle }) {
  const color = METAL_COLORS[metal] || '#2563eb';
  const std = WHO_STANDARDS[metal];
  return (
    <button onClick={() => onToggle(metal)}
      style={{
        padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5,
        fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
        border: `1.5px solid ${active ? color : '#e2e8f0'}`,
        background: active ? color + '15' : '#fafbfe',
        color: active ? color : '#94a3b8',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      }}>
      <span>{metal}</span>
      <span style={{ fontSize: 9, color: active ? color + 'aa' : '#cbd5e1', fontWeight: 500, letterSpacing: '0.3px' }}>{std?.limit}mg</span>
    </button>
  );
}

function MetalInput({ metal, value, onChange }) {
  const std = WHO_STANDARDS[metal];
  const color = METAL_COLORS[metal] || '#2563eb';
  const val = parseFloat(value) || 0;
  const exceeded = val > std.limit;
  return (
    <div style={{
      background: exceeded ? '#fff5f5' : '#fafbfe',
      border: `1.5px solid ${exceeded ? '#fca5a5' : '#e2e8f0'}`,
      borderRadius: 12, padding: '12px 14px', transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 800,
            color: exceeded ? '#991b1b' : color,
            background: exceeded ? '#fee2e2' : color + '15',
            border: `1.5px solid ${exceeded ? '#fca5a5' : color + '30'}`,
            padding: '2px 9px', borderRadius: 6
          }}>{metal}</span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{std.name}</span>
        </div>
        {exceeded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
            <AlertTriangle size={11} /> EXCEEDED
          </div>
        )}
      </div>
      <input type="number" step="0.0001" min="0" className="form-input"
        placeholder={`e.g. ${std.limit} mg/L (limit)`}
        value={value} onChange={e => onChange(metal, e.target.value)}
        style={{ fontSize: 13, borderColor: exceeded ? '#fca5a5' : undefined, background: exceeded ? '#fff' : '#f8faff' }} />
      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
        <span>WHO: <strong style={{ color: '#64748b' }}>{std.who_permissible} mg/L</strong></span>
        <span style={{ color: '#e2e8f0' }}>|</span>
        <span style={{ color: '#ef4444', fontSize: 10 }}>{std.health_risk}</span>
      </div>
    </div>
  );
}

export default function CalculatorTab({ onAddResult }) {
  const [selectedMetals, setSelectedMetals] = useState(['As', 'Pb', 'Cd', 'Fe', 'Mn', 'Cr', 'Cu', 'Zn']);
  const [concentrations, setConcentrations] = useState({});
  const [sampleInfo, setSampleInfo] = useState({ id: '', location: '', lat: '', lng: '', depth: '', source_type: 'Borewell', date: new Date().toISOString().split('T')[0] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const updateConc = (metal, val) => setConcentrations(prev => ({ ...prev, [metal]: val }));
  const toggleMetal = (metal) => setSelectedMetals(prev => prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]);

  const loadSample = (sample) => {
    setConcentrations(sample.concentrations);
    setSampleInfo({ id: sample.id, location: sample.location, lat: sample.coordinates.lat, lng: sample.coordinates.lng, depth: sample.depth, source_type: sample.source_type, date: sample.date });
    setSelectedMetals(Object.keys(sample.concentrations));
    setResult(null);
  };

  const calculate = () => {
    const validConc = {};
    selectedMetals.forEach(m => { if (concentrations[m] && parseFloat(concentrations[m]) >= 0) validConc[m] = concentrations[m]; });
    if (Object.keys(validConc).length < 2) return;
    setLoading(true);
    setTimeout(() => {
      const sample = {
        id: sampleInfo.id || `GW-${Date.now().toString().slice(-4)}`,
        location: sampleInfo.location || 'Unknown Location',
        coordinates: { lat: parseFloat(sampleInfo.lat) || 20.5937, lng: parseFloat(sampleInfo.lng) || 78.9629 },
        depth: sampleInfo.depth, source_type: sampleInfo.source_type, date: sampleInfo.date,
        concentrations: validConc,
      };
      const res = runFullAnalysis(sample);
      setResult(res);
      if (onAddResult) onAddResult({ ...res, sample_name: sample.location, sample_info: sampleInfo });
      setLoading(false);
    }, 700);
  };

  const reset = () => { setConcentrations({}); setResult(null); };

  const radarData = result ? Object.entries(result.hmpi?.Qn_values || {}).map(([metal, qn]) => ({ metal, Qn: Math.min(qn, 500), Limit: 100 })) : [];
  const barData = result ? Object.entries(concentrations).filter(([m]) => selectedMetals.includes(m)).map(([metal, val]) => {
    const v = parseFloat(val); const lim = WHO_STANDARDS[metal]?.limit;
    return { metal, value: v, limit: lim, ratio: v / lim };
  }).filter(d => d.value > 0) : [];

  const hmpiCls = result?.hmpi?.classification;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── QUICK LOAD SAMPLES WITH COMPACT GUIDE TOGGLE ─────────────────────────── */}
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)', borderColor: '#bfdbfe', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-blue)' }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 17, marginBottom: 2 }}>Select a City Station Sample</div>
              <div className="card-subtitle" style={{ marginBottom: 0, fontSize: 13 }}>Click any city card below to auto-load official CGWB groundwater spectroscopy lab data</div>
            </div>
          </div>

          {/* Compact Collapsible Guide Button */}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowGuide(!showGuide)}
            style={{ background: showGuide ? '#eff6ff' : '#ffffff', borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}>
            💡 {showGuide ? 'Hide App Guide' : 'How to Use App Guide'}
          </button>
        </div>

        {/* Collapsible Guide Modal Card */}
        {showGuide && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: '16px 20px', marginBottom: 20, animation: 'fadeUp 0.3s ease' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e40af', marginBottom: 10 }}>💡 How to Use JalTattva in 3 Simple Steps:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
              <div><strong>1. Select City Sample:</strong> Click any city card below (e.g. <em>Mumbai</em> or <em>Patna</em>) to auto-fill heavy metal lab data.</div>
              <div><strong>2. Calculate Indices:</strong> Click "Compute All Indices" to calculate HMPI, HEI, Cd, and Health Risk against WHO standards.</div>
              <div><strong>3. View Remediation:</strong> Check safety status, Health Impact Assessment tab, and recommended treatment filters!</div>
            </div>
          </div>
        )}

        {/* Prominent & Larger City Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {MOCK_SAMPLES.map(s => (
            <div key={s.id} className="sample-card" onClick={() => loadSample(s)}
              style={{ padding: '14px 16px', borderRadius: 14, border: '1.5px solid #dce4ef', background: '#ffffff', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="sample-card-id" style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  {s.id}
                </span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.source_type}</span>
              </div>
              <div className="sample-card-loc" style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                {s.location}
              </div>
              <div className="sample-card-state" style={{ fontSize: 12, color: '#64748b' }}>
                {s.state} · Depth: {s.depth}m
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INPUT GRID ─────────────────────────────────── */}
      <div className="grid-2 mb-24">
        {/* Sample Info */}
        <div className="card card-accent-top" style={{ '--card-accent': 'linear-gradient(90deg,#2563eb,#7c3aed)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={17} color="#2563eb" />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 15 }}>Sample Information</div>
              <div style={{ fontSize: 12, color: 'var(--text-400)' }}>Sample metadata &amp; source details</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sample ID</label>
              <input className="form-input" placeholder="GW-001" value={sampleInfo.id} onChange={e => setSampleInfo(p => ({ ...p, id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location Name</label>
              <input className="form-input" placeholder="Patna, Bihar" value={sampleInfo.location} onChange={e => setSampleInfo(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Well Depth (m)</label>
              <input className="form-input" type="number" placeholder="45" value={sampleInfo.depth} onChange={e => setSampleInfo(p => ({ ...p, depth: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Source Type</label>
              <select className="form-select" value={sampleInfo.source_type} onChange={e => setSampleInfo(p => ({ ...p, source_type: e.target.value }))}>
                {['Borewell','Open Well','Handpump','Spring','River'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Collection Date</label>
            <input className="form-input" type="date" value={sampleInfo.date} onChange={e => setSampleInfo(p => ({ ...p, date: e.target.value }))} />
          </div>
        </div>

        {/* Metal Selection + Inputs */}
        <div className="card card-accent-top" style={{ '--card-accent': 'linear-gradient(90deg,#0d9488,#2563eb)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={17} color="#0d9488" />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 15 }}>Select Metals &amp; Enter Concentrations</div>
              <div style={{ fontSize: 12, color: 'var(--text-400)' }}>Toggle metals · Enter lab values in mg/L</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {METALS.map(m => <MetalToggle key={m} metal={m} active={selectedMetals.includes(m)} onToggle={toggleMetal} />)}
          </div>

          <div className="labeled-divider"><span>Concentration Inputs (mg/L)</span></div>

          <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedMetals.map(m => (
              <MetalInput key={m} metal={m} value={concentrations[m] || ''} onChange={updateConc} />
            ))}
            {selectedMetals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-400)', fontSize: 14 }}>
                Select at least 2 metals above to begin
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── COMPUTE BUTTON ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 36, alignItems: 'center' }}>
        <button className="btn btn-primary btn-xl" onClick={calculate} disabled={loading}
          style={{ flex: 1, boxShadow: '0 8px 32px rgba(37,99,235,0.35)', fontSize: 15 }}>
          {loading
            ? <><div className="spinner" style={{ borderWidth: 2.5 }} />Analyzing sample data...</>
            : <><Zap size={18} />Compute All Indices — HMPI · HEI · CF · Cd · HHRA<ArrowRight size={16} /></>}
        </button>
        <button className="btn btn-ghost" onClick={reset}><RefreshCw size={15} />Reset</button>
      </div>

      {/* ── RESULTS ────────────────────────────────────── */}
      {result && (
        <div style={{ animation: 'fadeUp 0.5s ease' }}>

          {/* Status Banner */}
          <div style={{
            background: `linear-gradient(135deg, ${CLASS_COLORS[hmpiCls?.class] || '#2563eb'}10, ${CLASS_COLORS[hmpiCls?.class] || '#2563eb'}05)`,
            border: `1.5px solid ${CLASS_COLORS[hmpiCls?.class] || '#2563eb'}30`,
            borderRadius: 16, padding: '16px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: CLASS_COLORS[hmpiCls?.class] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {hmpiCls?.class === 'safe' ? '✅' : hmpiCls?.class === 'moderate' ? '⚠️' : '🚨'}
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: CLASS_COLORS[hmpiCls?.class] }}>{hmpiCls?.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-500)', marginTop: 2 }}>{hmpiCls?.description}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--text-400)' }}>
                Sample: <strong style={{ color: 'var(--text-700)' }}>{result.location || result.sample_id}</strong>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => generateHMPIPdfReport(result)} style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
                <FileDown size={14} /> Download Official PDF Report
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid-4 mb-24">
            {[
              { label: 'HMPI Score', val: result.hmpi?.value?.toFixed(2), sub: hmpiCls?.label, color: CLASS_COLORS[hmpiCls?.class], icon: '📊', bg: CLASS_COLORS[hmpiCls?.class] + '15' },
              { label: 'HEI Score', val: result.hei?.value?.toFixed(3), sub: result.hei?.classification?.label, color: CLASS_COLORS[result.hei?.classification?.class] || '#2563eb', icon: '🧮', bg: CLASS_COLORS[result.hei?.classification?.class] + '15' || '#eff6ff' },
              { label: 'Degree of Cont.', val: result.cd?.value?.toFixed(3), sub: result.cd?.classification?.label, color: CLASS_COLORS[result.cd?.classification?.class] || '#f59e0b', icon: '⚗️', bg: CLASS_COLORS[result.cd?.classification?.class] + '15' || '#fffbeb' },
              { label: 'Hazard Index (Adult)', val: result.hhra?.adult?.HI?.toFixed(4), sub: result.hhra?.adult?.HI_class?.label, color: result.hhra?.adult?.HI > 1 ? '#dc2626' : '#10b981', icon: '🛡️', bg: result.hhra?.adult?.HI > 1 ? '#fee2e2' : '#dcfce7' },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ animation: `fadeUp 0.4s ease ${i * 0.07}s both` }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{k.icon}</div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ color: k.color, fontSize: 26 }}>{k.val}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* HMPI Detail + Charts */}
          <div className="grid-2 mb-24">
            {/* Left: Gauge + QN breakdown */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📐</div>
                HMPI Breakdown
              </div>
              <div className="card-subtitle">Quotient values (Qn) per metal vs WHO threshold</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                <HMPIGauge value={result.hmpi?.value} size={160} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ background: '#f8faff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Formula</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#1e40af' }}>HMPI = Σ(100 × Cn/Sn) / n</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-500)', lineHeight: 1.7 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px' }}>
                      {[['🟢', 'HMPI < 100: Safe'], ['🟡', '100–200: Moderate'], ['🟠', '200–300: High Risk'], ['🔴', '> 300: Critical']].map(([e, t]) => (
                        <><span key={e}>{e}</span><span key={t} style={{ color: 'var(--text-400)' }}>{t}</span></>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(result.hmpi?.Qn_values || {}).sort((a, b) => b[1] - a[1]).map(([metal, qn]) => (
                  <MetalProgressBar key={metal} metal={metal} value={parseFloat(concentrations[metal] || 0)} standard={WHO_STANDARDS[metal]?.limit} qn={qn} color={METAL_COLORS[metal] || '#2563eb'} />
                ))}
              </div>
            </div>

            {/* Right: Charts */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📈</div>
                Contamination Profile
              </div>
              <div className="card-subtitle">Concentration vs WHO permissible limit (mg/L)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metal" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Observed (mg/L)" radius={[5, 5, 0, 0]}>
                    {barData.map((e, i) => <Cell key={i} fill={e.ratio > 1 ? '#ef4444' : METAL_COLORS[e.metal] || '#2563eb'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="labeled-divider" style={{ margin: '16px 0' }}><span>Radar — Pollution Fingerprint</span></div>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="metal" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <PolarRadiusAxis tick={{ fill: '#e2e8f0', fontSize: 9 }} />
                  <Radar name="Qn Score" dataKey="Qn" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} />
                  <Radar name="Safe Threshold" dataKey="Limit" stroke="#10b981" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Risk Assessment */}
          <div className="card mb-24">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={17} color="#e11d48" />
              </div>
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>Human Health Risk Assessment (HHRA)</div>
                <div className="card-subtitle" style={{ marginBottom: 0 }}>Non-carcinogenic Hazard Index (HI) &amp; Carcinogenic Risk (CR) — oral ingestion pathway</div>
              </div>
            </div>

            <div className="divider" />
            <div className="grid-2">
              {['adult', 'child'].map(group => {
                const hr = result.hhra?.[group];
                const isRisky = hr?.HI > 1;
                return (
                  <div key={group} className={`risk-panel ${isRisky ? 'unsafe' : 'safe'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{group === 'adult' ? '👤' : '👶'}</span>
                        <div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--text-900)', textTransform: 'capitalize' }}>{group}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-400)' }}>{group === 'adult' ? 'BW 70 kg · IR 2L/day' : 'BW 15 kg · IR 1L/day'}</div>
                        </div>
                      </div>
                      <span className={`badge ${isRisky ? 'badge-critical' : 'badge-safe'}`}>{hr?.HI_class?.label}</span>
                    </div>

                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 32, fontWeight: 900, color: isRisky ? '#dc2626' : '#10b981', marginBottom: 6 }}>
                      HI = {hr?.HI?.toFixed(4)}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-400)', marginBottom: 14 }}>
                      HI &gt; 1.0 = unacceptable non-carcinogenic risk via oral ingestion
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {Object.entries(hr?.HQ || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([metal, hq]) => (
                        <div key={metal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontFamily: 'JetBrains Mono', fontSize: 10.5, fontWeight: 800,
                            color: METAL_COLORS[metal] || '#2563eb',
                            background: (METAL_COLORS[metal] || '#2563eb') + '15',
                            padding: '2px 7px', borderRadius: 5, minWidth: 32, textAlign: 'center'
                          }}>{metal}</span>
                          <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 999 }}>
                            <div style={{ height: '100%', width: `${Math.min(hq * 100, 100)}%`, background: hq > 1 ? 'linear-gradient(90deg,#f87171,#dc2626)' : 'linear-gradient(90deg,#34d399,#10b981)', borderRadius: 999, transition: 'width 0.8s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: hq > 1 ? '#dc2626' : '#94a3b8', minWidth: 60 }}>HQ {hq.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>

                    {Object.keys(hr?.CR || {}).length > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-500)', marginBottom: 8 }}>⚠️ Carcinogenic Risk (CR):</div>
                        {Object.entries(hr.CR).map(([metal, cr]) => (
                          <div key={metal} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: METAL_COLORS[metal], fontWeight: 700 }}>{metal}</span>
                            <span style={{ fontFamily: 'JetBrains Mono', color: cr > 1e-4 ? '#dc2626' : '#10b981', fontWeight: 700 }}>{cr.toExponential(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formula reference */}
          <div className="grid-3">
            <FormulaCard title="Heavy Metal Pollution Index (HMPI)" formula="HMPI = Σ(100 × Cn/Sn) / n" description="n = number of metals. Qn = 100×Cn/Sn. Normalizes each metal against WHO standard. HMPI < 100 = Safe." color="#2563eb" />
            <FormulaCard title="Heavy Metal Evaluation Index (HEI)" formula="HEI = Σ (Cn / Smac)" description="Smac = WHO/BIS maximum admissible concentration. Cumulative deviation metric. HEI > 20 = High." color="#0d9488" />
            <FormulaCard title="Degree of Contamination (Cd)" formula="Cd = Σ CF_i − n\nCF_i = C_obs / C_background" description="Subtracts n metals count for normalized comparison across studies. Cd > 6 = Very High contamination." color="#f97316" />
          </div>
        </div>
      )}
    </div>
  );
}
