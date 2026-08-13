import { useState } from 'react';
import CalculatorTab from './components/CalculatorTab';
import MapTab from './components/MapTab';
import ReportsTab from './components/ReportsTab';
import ReferenceTab from './components/ReferenceTab';
import PredictiveTab from './components/PredictiveTab';
import RemediationTab from './components/RemediationTab';
import HealthMetricsTab from './components/HealthMetricsTab';
import LoginPage from './components/LoginPage';
import { NotificationStack, useNotifications } from './components/SharedComponents';
import { Calculator, Map, BarChart2, BookOpen, Droplets, Cpu, Wrench, HeartPulse, User, LogOut } from 'lucide-react';

const TABS = [
  { id: 'calculator',  label: 'HMPI Calculator',      icon: <Calculator size={14} /> },
  { id: 'map',         label: 'GIS Heatmap',          icon: <Map size={14} /> },
  { id: 'health',      label: 'Health Metrics',       icon: <HeartPulse size={14} /> },
  { id: 'predictive',  label: 'Predictive AI',        icon: <Cpu size={14} /> },
  { id: 'remediation', label: 'Remediation & Alerts', icon: <Wrench size={14} /> },
  { id: 'reports',     label: 'Reports & Data',       icon: <BarChart2 size={14} /> },
  { id: 'reference',   label: 'Reference Methods',    icon: <BookOpen size={14} /> },
];

export default function App() {
  const [user, setUser] = useState(null); // null = show LoginPage landing first
  const [activeTab, setActiveTab] = useState('calculator');
  const [extraResults, setExtraResults] = useState([]);

  const { notifs, addNotif, removeNotif } = useNotifications();

  const handleAddResult = (result) => {
    setExtraResults(prev => [...prev, result]);
    const cls = result.hmpi?.classification;
    addNotif(
      `Analysis complete — ${result.location || result.sample_id} · HMPI: ${result.hmpi?.value?.toFixed(2)} (${cls?.label})`,
      cls?.class === 'safe' ? 'success' : 'error'
    );
  };

  const roleTitles = {
    researcher: 'Researcher',
    scientist: 'CGWB Scientist',
    policymaker: 'Policy Maker',
  };

  // Dedicated Login Landing Screen
  if (!user) {
    return <LoginPage onLogin={u => setUser(u)} />;
  }

  return (
    <>
      {/* Decorative BG */}
      <div className="bg-grid" />
      <div className="bg-dots" />
      <div className="bg-orbs">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="app-wrapper">
        {/* ── NAVIGATION ── */}
        <nav className="nav">
          <div className="nav-inner">
            {/* Brand Logo */}
            <div className="nav-logo" onClick={() => setActiveTab('calculator')} style={{ cursor: 'pointer' }}>
              <div className="nav-logo-icon">
                <Droplets size={20} color="white" />
              </div>
              <div className="nav-logo-text">
                <span className="nav-logo-title">JAL TATVA <span style={{ fontSize: 11, color: '#2563eb' }}>जलतत्व</span></span>
                <span className="nav-logo-sub">Groundwater AI Platform</span>
              </div>
            </div>

            <div className="nav-divider" />

            {/* Tabs */}
            <div className="nav-tabs">
              {TABS.map(tab => (
                <button key={tab.id} className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Right Profile & Sign Out */}
            <div className="nav-right">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1.5px solid #dce4ef', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-700)' }}>
                <User size={13} color="#2563eb" />
                <span>{user.name}</span>
                <span style={{ color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 8px', borderRadius: 10, fontSize: 10.5 }}>
                  {roleTitles[user.role] || user.role}
                </span>
                <button onClick={() => setUser(null)} title="Sign Out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                  <LogOut size={13} />
                </button>
              </div>

              <div className="nav-who-badge">
                <div className="nav-who-dot" />
                WHO 2017 Standards
              </div>
            </div>
          </div>
        </nav>

        {/* ── HERO (only on calculator tab) ── */}
        {activeTab === 'calculator' && (
          <div className="hero">
            {/* Eyebrow */}
            <div className="hero-eyebrow">
              <div className="hero-eyebrow-dot" />
              Automated CGWB &amp; WHO Compliant Platform
            </div>

            {/* Title */}
            <h1 className="hero-title">
              JAL TATVA <span className="grad-text">Groundwater Quality</span><br />
              <span className="grad-text-teal">Heavy Metal Intelligence Engine</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-sub">
              Automates HMPI, HEI, Degree of Contamination, <strong>Health Impact Assessment</strong>, 15-Year AI Trend Analysis &amp; Treatment Remediation Planning.
            </p>

            {/* Compact Quick Stats Strip */}
            <div className="hero-stats-row" style={{ marginTop: 24 }}>
              {[
                { val: '17', lbl: 'Groundwater Stations' },
                { val: '5',  lbl: 'Pollution Indices' },
                { val: 'Health Impact', lbl: 'Pop. Assessment' },
                { val: '15-Year', lbl: 'AI Forecast' },
                { val: 'GIS Heatmap', lbl: 'Hotspot Zones' },
              ].map((s, i) => (
                <div key={i} className="hero-stat">
                  <div className="hero-stat-val">{s.val}</div>
                  <div className="hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="main">
          {activeTab === 'calculator'  && <CalculatorTab onAddResult={handleAddResult} />}
          {activeTab === 'map'         && <MapTab extraResults={extraResults} />}
          {activeTab === 'health'      && <HealthMetricsTab />}
          {activeTab === 'predictive'  && <PredictiveTab />}
          {activeTab === 'remediation' && <RemediationTab />}
          {activeTab === 'reports'     && <ReportsTab extraResults={extraResults} />}
          {activeTab === 'reference'   && <ReferenceTab />}
        </main>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div style={{ fontSize: 12, color: 'var(--text-400)', maxWidth: 800, margin: '0 auto', lineHeight: 1.9 }}>
            <span style={{ color: 'var(--text-700)', fontWeight: 700 }}>JAL TATVA (जलतत्व)</span> —
            Automated Heavy Metal Pollution Index Computation for Groundwater Quality Assessment.{' '}
            Implements <strong>WHO (2017)</strong> &amp; <strong>BIS IS:10500:2012</strong> standards.
            <span style={{ color: 'var(--text-300)', marginLeft: 8 }}>
              Ref: Prasad &amp; Bose (2001) · Hakanson (1980) · US-EPA RAGS (2004)
            </span>
          </div>
        </footer>
      </div>

      <NotificationStack notifs={notifs} onRemove={removeNotif} />
    </>
  );
}
