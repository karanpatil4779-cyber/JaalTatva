import { useState } from 'react';
import { Droplets, ShieldCheck, UserCheck, Sparkles, X, Check } from 'lucide-react';

const ROLES = [
  { id: 'researcher', title: 'Researcher', desc: 'Academic & hydrogeological statistical modeling', icon: '🔬' },
  { id: 'scientist', title: 'Scientist', desc: 'CGWB environmental chemist & lab auditor', icon: '🧪' },
  { id: 'policymaker', title: 'Policy Maker', desc: 'District regulator & municipal water authority', icon: '🏛️' },
];

export default function LoginModal({ isOpen, onClose, onLogin, currentUser }) {
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || 'researcher');
  const [userName, setUserName] = useState(currentUser?.name || 'Sunil Dangi');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: userName || 'Research User',
      role: selectedRole,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#ffffff', border: '1.5px solid var(--border)',
        borderRadius: 24, width: '100%', maxWidth: 460, padding: 32,
        boxShadow: 'var(--shadow-xl)', animation: 'fadeUp 0.3s ease both',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 20, top: 20, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="#64748b" />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--grad-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: 'var(--shadow-blue)' }}>
            <Droplets size={26} color="white" />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-900)' }}>
            Sign In to HMPI Platform
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-400)', marginTop: 4 }}>
            Select your professional role to customize data permissions
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Full Name / Official Title</label>
            <input className="form-input" style={{ fontSize: 14, padding: '11px 14px' }}
              value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="e.g. Dr. Sunil Dangi" />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Select User Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map(r => (
                <div key={r.id} onClick={() => setSelectedRole(r.id)}
                  style={{
                    padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
                    border: `1.5px solid ${selectedRole === r.id ? '#2563eb' : 'var(--border)'}`,
                    background: selectedRole === r.id ? '#eff6ff' : '#f8faff',
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.18s'
                  }}>
                  <span style={{ fontSize: 24 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedRole === r.id ? '#1e40af' : 'var(--text-900)' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-400)' }}>{r.desc}</div>
                  </div>
                  {selectedRole === r.id && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ boxShadow: 'var(--shadow-blue)', borderRadius: 14 }}>
            Continue as {ROLES.find(r => r.id === selectedRole)?.title}
          </button>
        </form>
      </div>
    </div>
  );
}
