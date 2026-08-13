import { Workflow, Database, Cpu, MapPin, ShieldAlert, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

const FLOW_STAGES = [
  {
    step: '01',
    title: 'Data Ingestion & Field Input',
    icon: <Database size={20} color="#2563eb" />,
    color: '#eff6ff', borderColor: '#bfdbfe', textColor: '#1e40af',
    desc: 'Receives laboratory spectroscopy values for 12 heavy metals (As, Pb, Cd, Cr, Cu, Fe, Mn, Ni, Zn, Hg, Se, Co) via direct input or CSV upload.',
    tech: ['CSV Parser', 'Form Sanitizer', 'CGWB Metadata'],
  },
  {
    step: '02',
    title: 'Multi-Index Math Engine',
    icon: <Workflow size={20} color="#0d9488" />,
    color: '#f0fdfa', borderColor: '#99f6e4', textColor: '#0f766e',
    desc: 'Calculates Heavy Metal Pollution Index (HMPI = ΣQn/n), Heavy Metal Evaluation Index (HEI), Degree of Contamination (Cd), and HHRA Hazard Index (HI).',
    tech: ['WHO (2017) Standard', 'BIS IS:10500:2012', 'US-EPA RAGS'],
  },
  {
    step: '03',
    title: '15-Year Predictive AI Model',
    icon: <Cpu size={20} color="#7c3aed" />,
    color: '#faf5ff', borderColor: '#e9d5ff', textColor: '#6b21a8',
    desc: 'Simulates 15-year hydrogeological trend forecasting (2010–2025 to 2030) using ARIMA-LSTM neural network weights with confidence bands.',
    tech: ['LSTM Neural Network', 'ARIMA Time-Series', 'Effluent Scenarios'],
  },
  {
    step: '04',
    title: 'GIS Spatial & Hotspot Mapping',
    icon: <MapPin size={20} color="#f59e0b" />,
    color: '#fffbeb', borderColor: '#fde68a', textColor: '#92400e',
    desc: 'Renders regional contamination risk circles and city marker popups with interactive WHO compliance details across India.',
    tech: ['React Leaflet', 'Choropleth Layer', 'Hotspot Heatmap'],
  },
  {
    step: '05',
    title: 'Remediation & Health Risk Plan',
    icon: <ShieldAlert size={20} color="#e11d48" />,
    color: '#fff1f2', borderColor: '#fecdd3', textColor: '#9f1239',
    desc: 'Matches exceeded contaminants against treatment technology matrix (RO, Ion Exchange, Coagulation) based on budget & suitability.',
    tech: ['Organ System Risk', 'Budget Filter', 'Treatment Selector'],
  },
  {
    step: '06',
    title: 'Reporting & Emergency Dispatches',
    icon: <FileText size={20} color="#059669" />,
    color: '#f0fdf4', borderColor: '#bbf7d0', textColor: '#166534',
    desc: 'Generates official PDF reports with SHA-256 cryptographic audit seal and triggers automated SMS/Email advisories to district authorities.',
    tech: ['jsPDF Generator', 'SMS Webhook API', 'Ministry Links'],
  },
];

export default function SystemFlowTab() {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      
      {/* ── HEADER CARD ── */}
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Workflow size={22} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-900)' }}>
              JalTattva System Flow &amp; Data Architecture
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-500)', marginTop: 2 }}>
              End-to-end pipeline: Lab Data Ingestion ➔ Math Engine ➔ 15-Yr AI Forecast ➔ GIS Hotspots ➔ Remediation ➔ PDF Report
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOW DIAGRAM GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
        {FLOW_STAGES.map((s, idx) => (
          <div key={idx} className="card" style={{ borderLeft: `4px solid ${s.textColor}`, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color, border: `1px solid ${s.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--text-900)' }}>
                  {s.title}
                </div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 800, color: s.textColor, background: s.color, padding: '2px 8px', borderRadius: 6, border: `1px solid ${s.borderColor}` }}>
                {s.step}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-500)', lineHeight: 1.6, marginBottom: 14 }}>
              {s.desc}
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {s.tech.map((t, tIdx) => (
                <span key={tIdx} style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── ARCHITECTURE SUMMARY CARD ── */}
      <div className="card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0' }}>
        <div className="card-title" style={{ fontSize: 16, marginBottom: 12 }}>
          <CheckCircle2 size={18} color="#10b981" /> JalTattva Enterprise Architecture Compliance
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-500)', lineHeight: 1.75 }}>
          JalTattva executes client-side real-time hydrogeological evaluation. All WHO (2017) and BIS IS:10500:2012 permissible limits are verified in under <strong>50ms</strong>. Reports, forecasting histograms, and state-level GIS heatmaps update dynamically across all stakeholder roles.
        </div>
      </div>

    </div>
  );
}
