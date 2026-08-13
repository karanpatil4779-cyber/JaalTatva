import { useState } from 'react';
import { Droplets, Shield, User, ArrowRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';

const ROLES = [
  {
    id: 'researcher',
    title: 'Researcher / Academic',
    desc: 'Hydrogeological modeling, baseline analysis & trend publishing',
    icon: '🔬',
    badge: 'Data Access',
  },
  {
    id: 'scientist',
    title: 'CGWB Scientist',
    desc: 'Lab audit, heavy metal spectroscopy & WHO compliance verification',
    icon: '🧪',
    badge: 'Lab Audit',
  },
  {
    id: 'policymaker',
    title: 'Policy Maker / Regulator',
    desc: 'District water remediation dispatch & CPCB emergency advisories',
    icon: '🏛️',
    badge: 'Policy & Dispatch',
  },
];

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [userName, setUserName] = useState('Dr. Sunil Dangi');
  const [organization, setOrganization] = useState('IIT Bombay / CGWB');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: userName || 'Authorized User',
      role: selectedRole,
      organization: organization || 'JalTattva Network',
    });
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(145deg, #fafbfe 0%, #eff6ff 50%, #f0fdfa 100%)',
      display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '24px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative Orbs */}
      <div className="bg-grid" />
      <div className="bg-dots" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div style={{
        maxWidth: 1020, width: '100%', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 32,
        alignItems: 'center', position: 'relative', zIndex: 10
      }}>
        {/* Left Branding */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1.5px solid #dbeafe', padding: '6px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
            <Sparkles size={14} /> Ministry of Jal Shakti &amp; CGWB Compliant
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', boxShadow: 'var(--shadow-blue)' }}>
              <Droplets size={30} color="white" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 34, fontWeight: 900, color: 'var(--text-900)', letterSpacing: '-1px', lineHeight: 1.1 }}>
                JAL TATVA <span style={{ fontSize: 18, color: '#2563eb', fontWeight: 700 }}>जलतत्व</span>
              </h1>
              <div style={{ fontSize: 13, color: 'var(--text-400)', fontWeight: 600 }}>Groundwater Intelligence &amp; Heavy Metal Portal</div>
            </div>
          </div>

          <p style={{ fontSize: 15, color: 'var(--text-500)', lineHeight: 1.7, marginBottom: 28 }}>
            Automated Heavy Metal Pollution Index (HMPI) computation engine, 15-year trend forecasting, state-level GIS heatmaps, and treatment remediation planning.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'WHO 2017 & BIS IS:10500:2012 Multi-Index Engine',
              'LSTM / ARIMA 15-Year Predictive Trend Analytics',
              'Remediation Treatment Selector (RO, Ion Exchange, Coagulation)',
              'Official Ministry & CGWB Hydrogeological Integration',
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: 'var(--text-700)' }}>
                <CheckCircle2 size={16} color="#10b981" /> {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Right Glassmorphism Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 28, padding: 36,
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-900)' }}>
              Sign In to JAL TATVA Portal
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-400)', marginTop: 4 }}>
              Select your role to unlock customized tools
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Full Name / Official Name</label>
              <input className="form-input" style={{ padding: '11px 14px', fontSize: 14 }}
                value={userName} onChange={e => setUserName(e.target.value)}
                placeholder="e.g. Dr. Sunil Dangi" required />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Organization / Institute</label>
              <input className="form-input" style={{ padding: '11px 14px', fontSize: 14 }}
                value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. IIT Bombay / CGWB Regional Office" />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Select Stakeholder Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ROLES.map(r => (
                  <div key={r.id} onClick={() => setSelectedRole(r.id)}
                    style={{
                      padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                      border: `1.5px solid ${selectedRole === r.id ? '#2563eb' : 'var(--border)'}`,
                      background: selectedRole === r.id ? '#eff6ff' : '#fafbfe',
                      display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.18s'
                    }}>
                    <span style={{ fontSize: 24 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: selectedRole === r.id ? '#1e40af' : 'var(--text-900)' }}>
                          {r.title}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: selectedRole === r.id ? '#dbeafe' : '#f1f5f9', color: selectedRole === r.id ? '#1d4ed8' : '#64748b', fontWeight: 700 }}>
                          {r.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-400)', marginTop: 2 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ borderRadius: 16, fontSize: 15, padding: '14px' }}>
              Access JalTattva Platform <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
