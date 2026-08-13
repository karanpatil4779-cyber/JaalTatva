import { useState } from 'react';
import { MOCK_SAMPLES, runFullAnalysis } from '../utils/hmpiEngine';
import { HeartPulse, Users, AlertTriangle, ShieldAlert, Activity, Brain, Stethoscope, Baby, Heart } from 'lucide-react';

const SUB_TABS = [
  { id: 'metals', label: 'Metal-Specific Risks' },
  { id: 'organs', label: 'Organ Systems' },
  { id: 'demographics', label: 'Demographics' },
];

export default function HealthMetricsTab() {
  const [selectedStation, setSelectedStation] = useState(MOCK_SAMPLES[6] || MOCK_SAMPLES[0]); // Default Mumbai Industrial Area
  const [activeSubTab, setActiveSubTab] = useState('metals');

  const result = runFullAnalysis(selectedStation);
  const hmpiScore = result.hmpi?.value || 140;
  const isHighRisk = hmpiScore > 100;
  const isCritical = hmpiScore > 200;

  // Population impact estimates based on station location & risk level
  const popTotal = selectedStation.location.includes('Mumbai') ? 250000 : selectedStation.location.includes('Delhi') ? 320000 : 180000;
  const popAtRisk = Math.round(popTotal * (isHighRisk ? 0.75 : 0.40));
  const popHighRisk = Math.round(popTotal * (isCritical ? 0.35 : isHighRisk ? 0.25 : 0.10));
  const popVulnerable = Math.round(popTotal * 0.285);

  // Organ system risk data computed from present heavy metals
  const organSystemsData = [
    {
      name: 'Nervous System', icon: <Brain size={18} color="#dc2626" />,
      risk: isHighRisk ? 'Critical' : 'Moderate', score: Math.min(98, Math.round(hmpiScore * 0.55 + 20)),
      metals: ['Pb', 'As', 'Hg', 'Mn'],
    },
    {
      name: 'Kidney', icon: <Activity size={18} color="#dc2626" />,
      risk: isHighRisk ? 'Critical' : 'Moderate', score: Math.min(95, Math.round(hmpiScore * 0.52 + 15)),
      metals: ['Cd', 'Pb', 'Hg'],
    },
    {
      name: 'Cardiovascular', icon: <Heart size={18} color="#dc2626" />,
      risk: isHighRisk ? 'Critical' : 'Moderate', score: Math.min(94, Math.round(hmpiScore * 0.50 + 18)),
      metals: ['As', 'Cd', 'Pb', 'Co'],
    },
    {
      name: 'Respiratory', icon: <Activity size={18} color="#dc2626" />,
      risk: isHighRisk ? 'Critical' : 'Low', score: Math.min(92, Math.round(hmpiScore * 0.48 + 12)),
      metals: ['Cr', 'As', 'Ni'],
    },
    {
      name: 'Reproductive', icon: <Baby size={18} color="#dc2626" />,
      risk: isHighRisk ? 'Critical' : 'Moderate', score: Math.min(90, Math.round(hmpiScore * 0.46 + 14)),
      metals: ['Pb', 'Cd'],
    },
    {
      name: 'Immune System', icon: <ShieldAlert size={18} color="#f59e0b" />,
      risk: 'Moderate', score: Math.min(75, Math.round(hmpiScore * 0.35 + 10)),
      metals: ['Zn', 'Cu', 'Cr', 'Ni'],
    },
  ];

  // Metal risk cards data
  const metalRisksData = [
    {
      name: 'Lead (Pb)', symbol: 'Pb', score: 95, risk: 'Critical', color: '#dc2626',
      effects: ['Neurological damage', 'Kidney damage', 'Reproductive issues', 'Hypertension & anemia'],
    },
    {
      name: 'Cadmium (Cd)', symbol: 'Cd', score: 80, risk: 'High', color: '#f97316',
      effects: ['Kidney tubular dysfunction', 'Bone disease (Itai-itai)', 'Cancer risk', 'Respiratory irritation'],
    },
    {
      name: 'Chromium (Cr)', symbol: 'Cr', score: 85, risk: 'High', color: '#dc2626',
      effects: ['Carcinogenic lung/nasal cancer', 'Skin ulceration', 'Gastrointestinal bleeding', 'Liver toxicity'],
    },
    {
      name: 'Copper (Cu)', symbol: 'Cu', score: 45, risk: 'Moderate', color: '#f59e0b',
      effects: ['Gastrointestinal distress', 'Wilson disease accumulation', 'Liver cirrhosis risk'],
    },
    {
      name: 'Arsenic (As)', symbol: 'As', score: 92, risk: 'Critical', color: '#dc2626',
      effects: ['Arsenicosis skin lesions', 'Bladder & lung cancer', 'Cardiovascular disease', 'Peripheral neuropathy'],
    },
    {
      name: 'Manganese (Mn)', symbol: 'Mn', score: 68, risk: 'Moderate', color: '#f59e0b',
      effects: ['Manganism Parkinson-like tremors', 'Neurobehavioral deficits', 'Motor dysfunction'],
    },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── HEADER TITLE ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text-900)' }}>
            Health Impact Assessment
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-500)', marginTop: 2 }}>
            Comprehensive health risk analysis and population impact assessment
          </div>
        </div>

        {/* Location Dropdown & Overall Risk Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-select" value={selectedStation.id} onChange={e => {
            const s = MOCK_SAMPLES.find(x => x.id === e.target.value);
            if (s) setSelectedStation(s);
          }} style={{ minWidth: 220, fontWeight: 700, borderRadius: 12, padding: '10px 16px' }}>
            {MOCK_SAMPLES.map(s => <option key={s.id} value={s.id}>{s.location}</option>)}
          </select>

          <span className={`badge ${isCritical ? 'badge-critical' : isHighRisk ? 'badge-high' : 'badge-safe'}`}
            style={{ fontSize: 13, padding: '8px 16px', borderRadius: 50, fontWeight: 800 }}>
            Overall Risk: {isCritical ? 'Critical' : isHighRisk ? 'High' : 'Low / Moderate'}
          </span>
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      <div className={`alert ${isHighRisk ? 'alert-danger' : 'alert-info'}`} style={{ borderRadius: 14, padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        <AlertTriangle size={20} color={isHighRisk ? '#e11d48' : '#1d4ed8'} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
            {isHighRisk ? 'High Health Risk Alert:' : 'Surveillance Notice:'}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {isHighRisk
              ? `This area (${selectedStation.location}) shows elevated heavy metal concentrations that pose significant health risks. Immediate action recommended for vulnerable populations.`
              : `Groundwater parameters in ${selectedStation.location} remain within acceptable health exposure thresholds.`}
          </div>
        </div>
      </div>

      {/* ── 4 POPULATION IMPACT KPI CARDS ── */}
      <div className="grid-4 mb-24">
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', marginBottom: 10 }}>
            <Users size={20} />
            <span className="kpi-label" style={{ marginBottom: 0 }}>Total Population</span>
          </div>
          <div className="kpi-value" style={{ fontSize: 32, color: 'var(--text-900)' }}>
            {popTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-400)', marginTop: 4 }}>Total regional aquifer reliance</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 10 }}>
            <AlertTriangle size={20} />
            <span className="kpi-label" style={{ marginBottom: 0 }}>At Risk</span>
          </div>
          <div className="kpi-value" style={{ fontSize: 32, color: '#f59e0b' }}>
            {popAtRisk.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
            {Math.round((popAtRisk / popTotal) * 100)}% of population
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', marginBottom: 10 }}>
            <HeartPulse size={20} />
            <span className="kpi-label" style={{ marginBottom: 0 }}>High Risk</span>
          </div>
          <div className="kpi-value" style={{ fontSize: 32, color: '#dc2626' }}>
            {popHighRisk.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginTop: 4 }}>
            {Math.round((popHighRisk / popTotal) * 100)}% of population
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6', marginBottom: 10 }}>
            <ShieldAlert size={20} />
            <span className="kpi-label" style={{ marginBottom: 0 }}>Vulnerable Groups</span>
          </div>
          <div className="kpi-value" style={{ fontSize: 32, color: '#8b5cf6' }}>
            {popVulnerable.toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>
            Children, elderly, pregnant
          </div>
        </div>
      </div>

      {/* ── 3 SUB-TABS SELECTOR ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#edf2f7', padding: 5, borderRadius: 14, width: 'fit-content' }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 700, fontFamily: "'Inter',sans-serif",
              background: activeSubTab === tab.id ? '#ffffff' : 'transparent',
              color: activeSubTab === tab.id ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SUB-TAB 1: METAL-SPECIFIC RISKS ── */}
      {activeSubTab === 'metals' && (
        <div className="grid-2" style={{ animation: 'fadeUp 0.3s ease both' }}>
          {metalRisksData.map((m, idx) => (
            <div key={idx} className="card" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--text-900)' }}>
                  {m.name}
                </div>
                <span className={`badge ${m.risk === 'Critical' ? 'badge-critical' : m.risk === 'High' ? 'badge-high' : 'badge-moderate'}`}>
                  {m.risk}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: 'var(--text-700)', marginBottom: 6 }}>
                <span>Risk Score</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: m.color, fontWeight: 800 }}>{m.score}/100</span>
              </div>

              <div className="progress-bar" style={{ height: 9, background: '#e2e8f0', marginBottom: 16 }}>
                <div className="progress-fill" style={{ width: `${m.score}%`, background: m.color }} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-500)', marginBottom: 6 }}>Health Effects:</div>
              <ul style={{ paddingLeft: 18, fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                {m.effects.map((eff, i) => <li key={i}>{eff}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── SUB-TAB 2: ORGAN SYSTEMS ── */}
      {activeSubTab === 'organs' && (
        <div className="grid-3" style={{ animation: 'fadeUp 0.3s ease both' }}>
          {organSystemsData.map((org, idx) => (
            <div key={idx} className="card" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {org.icon}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--text-900)' }}>
                  {org.name}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-500)', fontWeight: 600 }}>System Risk:</span>
                <span className={`badge ${org.risk === 'Critical' ? 'badge-critical' : 'badge-moderate'}`}>
                  {org.risk}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-700)', marginBottom: 6 }}>
                <span>Risk Score</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#dc2626', fontWeight: 800 }}>{org.score}/100</span>
              </div>

              <div className="progress-bar" style={{ height: 8, background: '#e2e8f0', marginBottom: 14 }}>
                <div className="progress-fill" style={{ width: `${org.score}%`, background: org.risk === 'Critical' ? '#dc2626' : '#f59e0b' }} />
              </div>

              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-500)', marginBottom: 6 }}>Affecting Metals:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {org.metals.map(m => (
                  <span key={m} className="metal-chip" style={{ borderColor: '#bfdbfe', color: '#1d4ed8', background: '#eff6ff', fontSize: 11 }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SUB-TAB 3: DEMOGRAPHICS ── */}
      {activeSubTab === 'demographics' && (
        <div className="grid-2" style={{ animation: 'fadeUp 0.3s ease both' }}>
          {[
            { group: 'Children (0–12 Years)', v: 'High Vulnerability', ratio: '85/100', desc: 'Higher gastrointestinal absorption rate & brain-blood barrier sensitivity to Lead (Pb) & Arsenic (As).' },
            { group: 'Pregnant & Lactating Women', v: 'High Vulnerability', ratio: '88/100', desc: 'Placental transfer of Cadmium & Lead posing neurodevelopmental risks to fetus.' },
            { group: 'Elderly (60+ Years)', v: 'Moderate Vulnerability', ratio: '72/100', desc: 'Pre-existing renal impairment accelerates Cadmium & Iron accumulation in tubular tissue.' },
            { group: 'Industrial & Agricultural Workers', v: 'High Exposure', ratio: '82/100', desc: 'Occupational inhalation combined with contaminated well water ingestion.' },
          ].map((d, i) => (
            <div key={i} className="card" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--text-900)' }}>
                  {d.group}
                </div>
                <span className="badge badge-high">{d.v}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-500)', lineHeight: 1.6, marginBottom: 10 }}>{d.desc}</div>
              <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>Exposure Risk Metric: {d.ratio}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
