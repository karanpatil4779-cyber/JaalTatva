import { useState } from 'react';
import { MOCK_SAMPLES, runFullAnalysis, METAL_COLORS } from '../utils/hmpiEngine';
import {
  Wrench, ShieldAlert, Send, Bell, Check, AlertTriangle, ChevronDown,
  Phone, Mail, MapPin, Building2, Landmark, Ambulance, Hospital, Droplets,
  FileText, Clock, Siren, Radio, Banknote, Activity,
} from 'lucide-react';

const TARGET_METALS = ['Pb', 'Cd', 'Cr', 'Cu', 'Zn', 'As'];

const TREATMENT_METHODS_DATA = [
  {
    id: 'ro',
    name: 'Reverse Osmosis',
    icon: '🔧',
    suitability: 'High Suitability',
    description: 'High-pressure membrane filtration to remove dissolved heavy metal ions and dissolved solids.',
    effectiveness: 96,
    cost: 'High',
    timeframe: '1-3 months',
    metalEffectiveness: { Pb: '98%', Cd: '96%', Cr: '94%', As: '95%' },
  },
  {
    id: 'ion_exchange',
    name: 'Ion Exchange',
    icon: '🔧',
    suitability: 'High Suitability',
    description: 'Exchange of heavy metal ions with harmless ions using synthetic resin beads in columns.',
    effectiveness: 92,
    cost: 'High',
    timeframe: '1-2 months',
    metalEffectiveness: { Pb: '95%', Cd: '92%', Cr: '88%', Cu: '90%' },
  },
  {
    id: 'electrocoagulation',
    name: 'Electrocoagulation',
    icon: '⚡',
    suitability: 'High Suitability',
    description: 'Electrical current destabilizes and aggregates dissolved heavy metal contaminants into flocs.',
    effectiveness: 90,
    cost: 'Medium',
    timeframe: '2-4 months',
    metalEffectiveness: { Pb: '92%', Cr: '90%', Fe: '95%', Mn: '88%' },
  },
  {
    id: 'chemical_precipitation',
    name: 'Chemical Precipitation',
    icon: '⚗️',
    suitability: 'Medium Suitability',
    description: 'Addition of chemical reagents to convert dissolved heavy metals into insoluble solid precipitates.',
    effectiveness: 85,
    cost: 'Low',
    timeframe: '1-2 months',
    metalEffectiveness: { Pb: '88%', Cr: '85%', Cu: '86%', Fe: '92%' },
  },
];

const AUTHORITY_TYPES = [
  { key: 'collector', icon: <Landmark size={18} />, title: 'District Collector', role: 'District Administration', desc: 'Nodal officer for disaster response, public relief and inter-agency coordination in the district.', responseTime: 'Immediate · 1 hr' },
  { key: 'spcb', icon: <ShieldAlert size={18} />, title: 'State Pollution Control Board', role: 'Environmental Regulator', desc: 'Enforces effluent discharge norms and industrial compliance for the affected catchment.', responseTime: '4-6 hrs' },
  { key: 'cgwb', icon: <Droplets size={18} />, title: 'CGWB Regional Office', role: 'Groundwater Authority', desc: 'Regional hydrogeological assessment, aquifer mapping and groundwater monitoring wells.', responseTime: '24 hrs' },
  { key: 'health', icon: <Hospital size={18} />, title: 'Chief Medical Officer', role: 'Public Health', desc: 'Issues health advisories and coordinates medical screening for the exposed population.', responseTime: '2-3 hrs' },
  { key: 'municipal', icon: <Building2 size={18} />, title: 'Municipal Corporation / Jal Board', role: 'Local Water Supply', desc: 'Manages local water distribution, supply interruption and alternate source provisioning.', responseTime: 'Same day' },
  { key: 'ndrf', icon: <Ambulance size={18} />, title: 'NDRF / State Disaster Response', role: 'Emergency Relief', desc: 'Deploys field response teams and tanker-based alternate drinking water supply.', responseTime: 'Immediate · 30 min' },
];

const STATE_CONTACTS = {
  default: {
    collector: '+91 1800-0000-100', spcb: '+91 1800-180-5000', cgwb: '+91 011-2611-0000',
    health: '104', municipal: '1916', ndrf: '+91 011-2343-8262',
  },
  Bihar: { collector: '+91 612 222 5000', spcb: '+91 612 222 5042', cgwb: '+91 612 221 0101', health: '104', municipal: '1916', ndrf: '1070' },
  'Uttar Pradesh': { collector: '+91 522 223 8000', spcb: '+91 522 262 3330', cgwb: '+91 522 233 7000', health: '108', municipal: '1916', ndrf: '1070' },
  Chhattisgarh: { collector: '+91 771 242 4011', spcb: '+91 771 242 7000', cgwb: '+91 771 222 2022', health: '108', municipal: '1916', ndrf: '1070' },
  Rajasthan: { collector: '+91 141 243 5000', spcb: '+91 141 220 2202', cgwb: '+91 141 271 1940', health: '108', municipal: '1916', ndrf: '1070' },
  Gujarat: { collector: '+91 2632 234 760', spcb: '+91 79 232 32511', cgwb: '+91 79 267 29000', health: '108', municipal: '1916', ndrf: '1070' },
  Kerala: { collector: '+91 477 225 1666', spcb: '+91 471 239 1750', cgwb: '+91 471 231 2000', health: '104', municipal: '1916', ndrf: '1070' },
  Maharashtra: { collector: '+91 22 2699 2500', spcb: '+91 22 2401 7777', cgwb: '+91 22 2672 9000', health: '108', municipal: '1916', ndrf: '1070' },
  Delhi: { collector: '+91 11 2346 2000', spcb: '+91 11 2346 2000', cgwb: '+91 11 2671 3190', health: '1075', municipal: '1916', ndrf: '1070' },
  'West Bengal': { collector: '+91 33 2214 4301', spcb: '+91 33 2335 7530', cgwb: '+91 33 2414 6541', health: '108', municipal: '1916', ndrf: '1070' },
  'Tamil Nadu': { collector: '+91 44 2530 5757', spcb: '+91 44 2235 3134', cgwb: '+91 44 2491 2741', health: '108', municipal: '1916', ndrf: '1070' },
  Telangana: { collector: '+91 40 2475 6696', spcb: '+91 40 2333 2750', cgwb: '+91 40 2339 7337', health: '108', municipal: '1916', ndrf: '1070' },
  Karnataka: { collector: '+91 80 2212 1500', spcb: '+91 80 2558 8760', cgwb: '+91 80 2221 0101', health: '108', municipal: '1916', ndrf: '1070' },
  Assam: { collector: '+91 361 270 9500', spcb: '+91 361 273 0940', cgwb: '+91 361 266 0833', health: '104', municipal: '1916', ndrf: '1070' },
  'Andhra Pradesh': { collector: '+91 891 275 2222', spcb: '+91 40 2323 8303', cgwb: '+91 891 250 3181', health: '108', municipal: '1916', ndrf: '1070' },
};

function buildAuthorities(sample) {
  const c = STATE_CONTACTS[sample.state] || STATE_CONTACTS['default'];
  const slug = sample.state.toLowerCase().replace(/\s+/g, '');
  return AUTHORITY_TYPES.map(a => ({
    ...a,
    phone: c[a.key],
    email: `${a.key}.${slug}@gov.in`,
  }));
}

const PLAN_PHASES = [
  { phase: 'Phase 1 (Days 1–15)', title: 'Site Inspection & Hydrogeological Audit', desc: 'Conduct multi-depth water sampling and establish baseline spectroscopy parameters.' },
  { phase: 'Phase 2 (Days 16–45)', title: 'Equipment Procurement & Installation', desc: 'Install high-pressure RO membrane units or ion-exchange resin beds at local distribution nodes.' },
  { phase: 'Phase 3 (Days 46–75)', title: 'Pilot Testing & Performance Validation', desc: 'Verify 95%+ heavy metal removal efficiency before municipal connection.' },
  { phase: 'Phase 4 (Days 76–90)', title: 'Full Deployment & Real-time Sensor Monitoring', desc: 'Connect automated sensor telemetry for ongoing compliance surveillance.' },
];

const PREVENTION_STRATEGIES = [
  { title: 'Zero Liquid Discharge (ZLD)', desc: 'Mandate ZLD effluent treatment plants for electroplating and tannery industrial units.' },
  { title: 'Aquifer Protection Zones', desc: 'Establish 500m buffer protection zones around public drinking groundwater wells.' },
  { title: 'Phytoremediation Buffer Belts', desc: 'Plant heavy-metal hyperaccumulator vegetation (vetiver grass, sunflowers) near runoff channels.' },
  { title: 'Agricultural Runoff Controls', desc: 'Regulate phosphate fertilizer usage to prevent Cadmium & Arsenic accumulation in soil.' },
];

const BUDGET_ADVISORY = {
  'Low Budget': { text: 'Prioritize low-cost chemical precipitation, aeration + filtration and household point-of-use filters.', color: '#0d9488' },
  'Medium Budget': { text: 'Combine electrocoagulation units with point-of-use RO purifiers for the most affected wards.', color: '#d97706' },
  'High Budget': { text: 'Deploy community-scale RO + ion-exchange plants with continuous sensor telemetry.', color: '#2563eb' },
};

/* ── Animated expandable section (smooth grid-rows transition on click) ── */
function Accordion({ title, subtitle, icon, accent, badge, open, onToggle, children }) {
  return (
    <div className="card mb-24" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 14, padding: '18px 22px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${accent}18`, color: accent, transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'scale(1.08)' : 'scale(1)',
          }}>{icon}</span>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {badge}
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <ChevronDown size={20} />
          </span>
        </div>
      </button>

      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.5s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 0.4s ease 0.05s' }}>
          <div style={{ padding: '4px 22px 24px', borderTop: open ? '1px solid #e2e8f0' : '1px solid transparent', transition: 'border-color 0.4s ease' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Per-metal detailed remedy block (click to expand with transition) ── */
function RemedyBlock({ r, open, onToggle }) {
  const color = METAL_COLORS[r.metal] || '#64748b';
  const rem = r.remediation;
  return (
    <div style={{ border: `1.5px solid ${open ? color : '#e2e8f0'}`, borderRadius: 16, background: open ? '#fafbff' : '#ffffff', overflow: 'hidden', transition: 'all 0.3s ease' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 800, color: color,
          background: `${color}15`, padding: '4px 12px', borderRadius: 10, flexShrink: 0,
        }}>{r.metal}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.fullName}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Observed {r.observed} mg/L vs Limit {r.limit} mg/L · {r.ratio}× over
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          <AlertTriangle size={11} style={{ verticalAlign: '-2px' }} /> EXCEEDED
        </span>
        <span style={{
          display: 'flex', color, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}><ChevronDown size={18} /></span>
      </button>

      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 0.4s ease 0.05s' }}>
          <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                <Send size={12} style={{ verticalAlign: '-2px' }} /> Immediate Action
              </div>
              <div style={{ fontSize: 12.5, color: '#881337', lineHeight: 1.6 }}>{rem.immediateAction}</div>
            </div>
            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#115e59', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                <Wrench size={12} style={{ verticalAlign: '-2px' }} /> Long-Term Solution
              </div>
              <div style={{ fontSize: 12.5, color: '#134e4a', lineHeight: 1.6 }}>{rem.longTermSolution}</div>
            </div>
            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                <Activity size={12} style={{ verticalAlign: '-2px' }} /> Suitable Treatment Techniques
              </div>
              {rem.techniques.map((t, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr 0.7fr', gap: 10,
                  padding: '8px 10px', borderRadius: 10, marginBottom: 6, background: '#ffffff',
                  border: '1px solid #e2e8f0', fontSize: 12.5, alignItems: 'center',
                }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                  <div><span style={{ color: '#64748b' }}>Eff:</span> <strong style={{ color: '#0d9488' }}>{t.efficiency}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Cost:</span> <strong style={{ color: t.cost === 'High' ? '#dc2626' : t.cost === 'Medium' ? '#d97706' : '#0d9488' }}>{t.cost}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Complexity:</span> <strong style={{ color: '#2563eb' }}>{t.complexity}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RemediationTab() {
  const [selectedStationId, setSelectedStationId] = useState(MOCK_SAMPLES[6].id);
  const [openSection, setOpenSection] = useState('remedies');
  const [openMetal, setOpenMetal] = useState(null);
  const [selectedTargetMetals, setSelectedTargetMetals] = useState(['Pb', 'Cd', 'Cr']);
  const [budget, setBudget] = useState('Medium Budget');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [dispatched, setDispatched] = useState({});
  const [dispatchedAll, setDispatchedAll] = useState(false);

  const selectedStation = MOCK_SAMPLES.find(s => s.id === selectedStationId) || MOCK_SAMPLES[0];
  const sampleResult = runFullAnalysis(selectedStation);
  const authorities = buildAuthorities(selectedStation);
  const exceededMetals = sampleResult.remediation.map(r => r.metal);
  const classInfo = sampleResult.hmpi?.classification;

  const [alertPhone, setAlertPhone] = useState(authorities[0]?.phone || '+91 98765 43210');
  const [alertEmail, setAlertEmail] = useState(authorities[0]?.email || 'collector.district@cgwb.gov.in');
  const [alertSent, setAlertSent] = useState(false);

  const toggleTargetMetal = (metal) => {
    setSelectedTargetMetals(prev =>
      prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]
    );
  };

  const dispatchAuthority = (key) => {
    setDispatched(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setDispatched(prev => ({ ...prev, [key]: false })), 4000);
  };

  const dispatchAll = () => {
    setDispatchedAll(true);
    setTimeout(() => setDispatchedAll(false), 4000);
  };

  const triggerEmergencyAlert = (e) => {
    e.preventDefault();
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  const handleStationChange = (e) => {
    const id = e.target.value;
    setSelectedStationId(id);
    const station = MOCK_SAMPLES.find(s => s.id === id) || MOCK_SAMPLES[0];
    const auth = buildAuthorities(station);
    setAlertPhone(auth[0]?.phone || '+91 98765 43210');
    setAlertEmail(auth[0]?.email || 'collector.district@cgwb.gov.in');
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── SELECTED AREA & CONTROLS ── */}
      <div className="card mb-24" style={{ background: '#ffffff', border: '1.5px solid #dce4ef', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={18} />
            </span>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                {selectedStation.location}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {selectedStation.id} · {selectedStation.district}, {selectedStation.state} · {selectedStation.source_type} · Depth {selectedStation.depth}m
              </div>
            </div>
          </div>
          <span className={`badge badge-${classInfo?.class === 'safe' ? 'safe' : classInfo?.class === 'moderate' ? 'moderate' : 'critical'}`} style={{ fontSize: 12, padding: '6px 14px' }}>
            {classInfo?.label} · HMPI {sampleResult.hmpi?.value?.toFixed(1)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, marginBottom: 16 }}>
          <div>
            <label className="form-label">Monitored Station / Area (drives remedies & alerts)</label>
            <select className="form-select" value={selectedStationId} onChange={handleStationChange} style={{ fontWeight: 700, borderRadius: 12, padding: '10px 14px' }}>
              {MOCK_SAMPLES.map(s => (
                <option key={s.id} value={s.id}>{s.id} — {s.location} ({s.state})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Remediation Budget</label>
            <select className="form-select" value={budget} onChange={e => setBudget(e.target.value)} style={{ fontWeight: 700, borderRadius: 12, padding: '10px 14px' }}>
              <option value="Low Budget">Low Budget</option>
              <option value="Medium Budget">Medium Budget</option>
              <option value="High Budget">High Budget</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-700)' }}>Target Contaminants:</span>
            {TARGET_METALS.map(metal => {
              const active = selectedTargetMetals.includes(metal);
              return (
                <button key={metal} onClick={() => toggleTargetMetal(metal)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 800,
                    border: `1.5px solid ${active ? '#0f172a' : '#e2e8f0'}`,
                    background: active ? '#0f172a' : '#ffffff',
                    color: active ? '#ffffff' : '#64748b',
                    boxShadow: active ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
                    transition: 'all 0.18s'
                  }}>
                  {metal}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: exceededMetals.length ? '#dc2626' : '#0d9488', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} />
            {exceededMetals.length ? `${exceededMetals.length} metal(s) exceeding WHO limit: ${exceededMetals.join(', ')}` : 'No metal exceeds WHO limit'}
          </span>
        </div>
      </div>

      {/* ── SECTION 1: DETAILED REMEDIES FOR SELECTED AREA ── */}
      <Accordion
        id="remedies"
        title="Detailed Remedies for Selected Area"
        subtitle={`${exceededMetals.length} contaminant(s) detected at ${selectedStation.location} — click each metal for action plan`}
        icon={<FileText size={18} />}
        accent="#d97706"
        open={openSection === 'remedies'}
        onToggle={() => setOpenSection(openSection === 'remedies' ? null : 'remedies')}
        badge={<span className="badge" style={{ background: exceededMetals.length ? '#fee2e2' : '#dcfce7', color: exceededMetals.length ? '#991b1b' : '#166534' }}>{exceededMetals.length} found</span>}
      >
        {sampleResult.remediation.length === 0 ? (
          <div className="alert alert-success" style={{ marginBottom: 0 }}>
            <Check size={16} /> No heavy metal exceeded the WHO permissible limits for {selectedStation.location}. Routine monitoring recommended.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sampleResult.remediation.map(r => (
              <RemedyBlock
                key={r.metal}
                r={r}
                open={openMetal === r.metal}
                onToggle={() => setOpenMetal(openMetal === r.metal ? null : r.metal)}
              />
            ))}
          </div>
        )}
      </Accordion>

      {/* ── SECTION 2: TREATMENT METHODS ── */}
      <Accordion
        id="methods"
        title="Suitable Treatment Methods"
        subtitle="Tackle the situation with proven remediation technologies — recommended ones match this area's contaminants"
        icon={<Wrench size={18} />}
        accent="#2563eb"
        open={openSection === 'methods'}
        onToggle={() => setOpenSection(openSection === 'methods' ? null : 'methods')}
        badge={<span className="badge badge-high">Budget: {budget}</span>}
      >
        <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Banknote size={16} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <strong style={{ color: '#1e40af' }}>{budget} advisory: </strong>{BUDGET_ADVISORY[budget].text}
          </div>
        </div>

        <div className="grid-2">
          {TREATMENT_METHODS_DATA.map(method => {
            const recommended = Object.keys(method.metalEffectiveness).some(m => exceededMetals.includes(m));
            const isSelected = selectedMethod === method.id;
            return (
              <div key={method.id} className="card" style={{ borderRadius: 20, padding: 24, position: 'relative', border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{method.icon}</span>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                      {method.name}
                    </div>
                  </div>
                  <span className="badge" style={{ background: '#0f172a', color: '#ffffff', fontSize: 11, padding: '5px 12px', borderRadius: 20 }}>
                    {method.suitability}
                  </span>
                </div>

                {recommended && (
                  <div style={{ position: 'absolute', top: -10, right: 16, fontSize: 11, fontWeight: 800, background: '#2563eb', color: '#fff', padding: '4px 12px', borderRadius: 20, boxShadow: 'var(--shadow-blue)' }}>
                    Recommended for {selectedStation.location}
                  </div>
                )}

                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                  {method.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                      <span>Effectiveness:</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{method.effectiveness}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8, background: '#e2e8f0' }}>
                      <div className="progress-fill" style={{ width: `${method.effectiveness}%`, background: '#0f172a' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Cost:</span>
                      <strong style={{ color: method.cost === 'High' ? '#dc2626' : '#2563eb' }}>{method.cost}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Timeframe:</span>
                      <strong style={{ color: '#0f172a' }}>{method.timeframe}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                    Metal-Specific Effectiveness:
                  </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
                    {Object.entries(method.metalEffectiveness).map(([metal, eff]) => (
                      <div key={metal} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{metal}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{eff}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-secondary btn-full"
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    background: isSelected ? '#2563eb' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                    borderRadius: 12, fontSize: 13, padding: '10px'
                  }}>
                  {isSelected ? '✓ Method Selected' : 'Select Method'}
                </button>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* ── SECTION 3: IMPLEMENTATION PLAN ── */}
      <Accordion
        id="plan"
        title="90-Day Implementation Plan"
        subtitle="Deployment roadmap for the selected treatment methods"
        icon={<Clock size={18} />}
        accent="#0d9488"
        open={openSection === 'plan'}
        onToggle={() => setOpenSection(openSection === 'plan' ? null : 'plan')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLAN_PHASES.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: 14 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
              }}>{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>{p.phase}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* ── SECTION 4: PREVENTION STRATEGIES ── */}
      <Accordion
        id="prevention"
        title="Prevention Strategies"
        subtitle="Long-term measures to prevent re-contamination of the aquifer"
        icon={<ShieldAlert size={18} />}
        accent="#7c3aed"
        open={openSection === 'prevention'}
        onToggle={() => setOpenSection(openSection === 'prevention' ? null : 'prevention')}
      >
        <div className="grid-2">
          {PREVENTION_STRATEGIES.map((item, idx) => (
            <div key={idx} className="card" style={{ borderRadius: 16 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* ── AUTHORITY EMERGENCY ALERTS ── */}
      <div className="card mb-24" style={{ borderLeft: '4px solid #ef4444', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <div className="card-title" style={{ fontSize: 16 }}>
            <Siren size={18} color="#ef4444" /> Authority Emergency Alerts — {selectedStation.district}, {selectedStation.state}
          </div>
          <span className="badge badge-critical">Emergency Dispatch Active</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>
          Officials responsible for water quality response in the selected area. Click <strong>Dispatch</strong> to send a geo-tagged
          emergency report for {selectedStation.location} (HMPI {sampleResult.hmpi?.value?.toFixed(1)} — {classInfo?.label}).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {authorities.map(a => {
            const sent = dispatched[a.key];
            return (
              <div key={a.key} style={{
                border: sent ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
                borderRadius: 16, padding: 16, background: sent ? '#f0fdf4' : '#ffffff',
                transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
              }}>
                {sent && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#22c55e', animation: 'fadeUp 0.3s ease' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: sent ? '#dcfce7' : '#f1f5f9', color: sent ? '#166534' : '#475569',
                  }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{a.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55, marginBottom: 12 }}>{a.desc}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={13} color="#2563eb" />
                    <a href={`tel:${a.phone}`} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{a.phone}</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="#0d9488" />
                    <span style={{ color: '#334155' }}>{a.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={13} color="#d97706" />
                    <span style={{ color: '#334155' }}>Expected response: <strong>{a.responseTime}</strong></span>
                  </div>
                </div>

                <button className="btn btn-full" onClick={() => dispatchAuthority(a.key)}
                  style={{
                    background: sent ? '#16a34a' : '#fff1f2', color: sent ? '#ffffff' : '#e11d48',
                    border: sent ? 'none' : '1.5px solid #fecdd3', borderRadius: 10, fontSize: 13, padding: '9px',
                  }}>
                  {sent ? <><Check size={14} /> Alert Dispatched</> : <><Send size={14} /> Dispatch {a.title}</>}
                </button>
              </div>
            );
          })}
        </div>

        <button className="btn btn-danger btn-full mt-16" onClick={dispatchAll}
          style={{ padding: '12px', borderRadius: 12, fontSize: 13.5, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
          {dispatchedAll ? <><Check size={15} /> Emergency Bulletin Broadcast to All Authorities</> : <><Radio size={15} /> Broadcast Emergency Bulletin to All {authorities.length} Authorities</>}
        </button>
      </div>

      {/* ── MANUAL SMS & EMAIL DISPATCHER ── */}
      <div className="card mb-24" style={{ borderLeft: '4px solid #ef4444' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ fontSize: 16 }}>
            <Bell size={18} color="#ef4444" /> Manual SMS &amp; Email Dispatch
          </div>
          <span className="badge badge-critical">Emergency Dispatch Active</span>
        </div>

        <form onSubmit={triggerEmergencyAlert} className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">SMS Alert Recipient (District Authority)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="form-input" style={{ paddingLeft: 34 }} value={alertPhone} onChange={e => setAlertPhone(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Notification Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input className="form-input" style={{ paddingLeft: 34 }} value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ padding: '11px 24px' }}>
            <Send size={15} /> Dispatch Emergency Alert
          </button>
        </form>

        {alertSent && (
          <div className="alert alert-success mt-16" style={{ marginBottom: 0, animation: 'fadeUp 0.3s ease' }}>
            <Check size={16} /> SMS &amp; Email Dispatch Sent! Emergency notification dispatched to {alertPhone} and {alertEmail} with sample {selectedStation.location} HMPI = {sampleResult.hmpi?.value?.toFixed(1)}.
          </div>
        )}
      </div>

    </div>
  );
}
