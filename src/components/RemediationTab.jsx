import { useState } from 'react';
import { MOCK_SAMPLES, runFullAnalysis, WHO_STANDARDS } from '../utils/hmpiEngine';
import { Wrench, ShieldAlert, Send, Bell, Check, AlertTriangle, ChevronRight, Phone, Mail, DollarSign, Filter, Layers } from 'lucide-react';

const SUB_TABS = [
  { id: 'methods', label: 'Treatment Methods' },
  { id: 'plan', label: 'Implementation Plan' },
  { id: 'prevention', label: 'Prevention Strategies' },
];

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

export default function RemediationTab() {
  const [selectedStation, setSelectedStation] = useState(MOCK_SAMPLES[6] || MOCK_SAMPLES[0]);
  const [activeSubTab, setActiveSubTab] = useState('methods');
  const [selectedTargetMetals, setSelectedTargetMetals] = useState(['Pb', 'Cd', 'Cr']);
  const [budget, setBudget] = useState('Medium Budget');
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [alertPhone, setAlertPhone] = useState('+91 98765 43210');
  const [alertEmail, setAlertEmail] = useState('collector.district@cgwb.gov.in');
  const [alertSent, setAlertSent] = useState(false);

  const sampleResult = runFullAnalysis(selectedStation);

  const toggleTargetMetal = (metal) => {
    setSelectedTargetMetals(prev =>
      prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]
    );
  };

  const triggerEmergencyAlert = (e) => {
    e.preventDefault();
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── TOP CONTROLS & TARGET CONTAMINANTS BAR (PICTURE 3 & 4) ── */}
      <div className="card mb-24" style={{ background: '#ffffff', border: '1.5px solid #dce4ef', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Target Contaminants Toggle Chips */}
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

          {/* Budget Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select className="form-select" value={budget} onChange={e => setBudget(e.target.value)}
              style={{ width: 170, fontWeight: 700, borderRadius: 12, padding: '9px 14px' }}>
              <option value="Low Budget">Low Budget</option>
              <option value="Medium Budget">Medium Budget</option>
              <option value="High Budget">High Budget</option>
            </select>
          </div>
        </div>

        {/* 3 Sub-Tabs Selector */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          {SUB_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
              style={{
                padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 700, fontFamily: "'Inter',sans-serif",
                background: activeSubTab === tab.id ? '#edf2f7' : 'transparent',
                color: activeSubTab === tab.id ? '#0f172a' : '#64748b',
                transition: 'all 0.18s'
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUB-TAB 1: TREATMENT METHODS (MATCHING PICTURE 3 & 4) ── */}
      {activeSubTab === 'methods' && (
        <div className="grid-2 mb-24" style={{ animation: 'fadeUp 0.3s ease both' }}>
          {TREATMENT_METHODS_DATA.map(method => (
            <div key={method.id} className="card" style={{ borderRadius: 20, padding: 24, position: 'relative', border: selectedMethod === method.id ? '2px solid #2563eb' : '1.5px solid #e2e8f0' }}>
              
              {/* Header with Suitability Badge */}
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

              {/* Description */}
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                {method.description}
              </p>

              {/* Effectiveness Progress Bar + Cost & Timeframe */}
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

              {/* Metal-Specific Effectiveness Breakdown */}
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

              {/* Select Method Button */}
              <button className="btn btn-secondary btn-full"
                onClick={() => setSelectedMethod(method.id)}
                style={{
                  background: selectedMethod === method.id ? '#2563eb' : '#f8fafc',
                  color: selectedMethod === method.id ? '#ffffff' : '#0f172a',
                  borderColor: selectedMethod === method.id ? '#2563eb' : '#e2e8f0',
                  borderRadius: 12, fontSize: 13, padding: '10px'
                }}>
                {selectedMethod === method.id ? '✓ Method Selected' : 'Select Method'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── SUB-TAB 2: IMPLEMENTATION PLAN ── */}
      {activeSubTab === 'plan' && (
        <div className="card mb-24" style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="card-title" style={{ fontSize: 16, marginBottom: 14 }}>
            🗓️ 90-Day Remediation Deployment Roadmap
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { phase: 'Phase 1 (Days 1–15)', title: 'Site Inspection & Hydrogeological Audit', desc: 'Conduct multi-depth water sampling and establish baseline spectroscopy parameters.' },
              { phase: 'Phase 2 (Days 16–45)', title: 'Equipment Procurement & Installation', desc: 'Install high-pressure RO membrane units or ion-exchange resin beds at local distribution nodes.' },
              { phase: 'Phase 3 (Days 46–75)', title: 'Pilot Testing & Performance Validation', desc: 'Verify 95%+ heavy metal removal efficiency before municipal connection.' },
              { phase: 'Phase 4 (Days 76–90)', title: 'Full Deployment & Real-time Sensor Monitoring', desc: 'Connect automated sensor telemetry for ongoing compliance surveillance.' },
            ].map((p, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>{p.phase}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: PREVENTION STRATEGIES ── */}
      {activeSubTab === 'prevention' && (
        <div className="grid-2 mb-24" style={{ animation: 'fadeUp 0.3s ease both' }}>
          {[
            { title: 'Zero Liquid Discharge (ZLD)', desc: 'Mandate ZLD effluent treatment plants for electroplating and tannery industrial units.' },
            { title: 'Aquifer Protection Zones', desc: 'Establish 500m buffer protection zones around public drinking groundwater wells.' },
            { title: 'Phytoremediation Buffer Belts', desc: 'Plant heavy-metal hyperaccumulator vegetation (vetiver grass, sunflowers) near runoff channels.' },
            { title: 'Agricultural Runoff Controls', desc: 'Regulate phosphate fertilizer usage to prevent Cadmium & Arsenic accumulation in soil.' },
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ borderRadius: 16 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                🛡️ {item.title}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── EMERGENCY SMS & EMAIL DISPATCHER ── */}
      <div className="card mb-24" style={{ borderLeft: '4px solid #ef4444' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ fontSize: 16 }}>
            <Bell size={18} color="#ef4444" /> Real-time Automated SMS &amp; Email Alert System
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
