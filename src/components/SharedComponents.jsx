import { useState, useCallback } from 'react';
import { Activity, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

// ─── Notification System ──────────────────────────────────────────
export function useNotifications() {
  const [notifs, setNotifs] = useState([]);
  const addNotif = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifs(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 4500);
  }, []);
  const removeNotif = useCallback((id) => setNotifs(prev => prev.filter(n => n.id !== id)), []);
  return { notifs, addNotif, removeNotif };
}

export function NotificationStack({ notifs, onRemove }) {
  if (!notifs.length) return null;
  const icons = { success: <CheckCircle size={16} />, error: <AlertTriangle size={16} />, info: <Info size={16} /> };
  return (
    <div className="notif-pill">
      {notifs.map(n => (
        <div key={n.id} className={`notif notif-${n.type}`} onClick={() => onRemove(n.id)} style={{ cursor: 'pointer' }}>
          {icons[n.type] || icons.info}
          <span style={{ flex: 1 }}>{n.message}</span>
          <X size={13} style={{ opacity: 0.6 }} />
        </div>
      ))}
    </div>
  );
}

// ─── HMPI Gauge (SVG Arc) ─────────────────────────────────────────
export function HMPIGauge({ value, size = 160 }) {
  const max = 400, clamped = Math.min(value || 0, max);
  const pct = clamped / max;
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const color = value < 100 ? '#10b981' : value < 200 ? '#f59e0b' : value < 300 ? '#ef4444' : '#dc2626';
  const bgColor = value < 100 ? '#dcfce7' : value < 200 ? '#fef9c3' : value < 300 ? '#fee2e2' : '#fca5a5';
  function polar(angle, rad) {
    const a = (angle * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  }
  const startAngle = -225, sweepDeg = 270 * pct;
  const s = polar(startAngle, r), e = polar(startAngle + sweepDeg, r);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return (
    <div className="gauge-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size * 0.08} strokeLinecap="round"
          strokeDasharray={`${270 / 360 * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          transform={`rotate(-225 ${cx} ${cy})`} />
        {/* Colored arc */}
        {value > 0 && (
          <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`}
            fill="none" stroke={color} strokeWidth={size * 0.08} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 2px 8px ${color}50)` }} />
        )}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={size * 0.25} fill={bgColor} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          fontSize={size * 0.155} fontWeight="800" fontFamily="'Plus Jakarta Sans',sans-serif">
          {value ? value.toFixed(1) : '—'}
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" fill="#94a3b8"
          fontSize={size * 0.08} fontFamily="Inter,sans-serif" fontWeight="600">
          HMPI
        </text>
      </svg>
    </div>
  );
}

// ─── Metal Progress Bar ───────────────────────────────────────────
export function MetalProgressBar({ metal, value, standard, qn, color }) {
  const pct = Math.min((value / (standard * 5)) * 100, 100);
  const exceeded = value > standard;
  const ratio = value / standard;
  return (
    <div className={`metric-block ${exceeded ? 'exceeded' : ''}`}>
      <div className="metric-block-header">
        <div className="metric-block-name">
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 800,
            color: exceeded ? '#991b1b' : color,
            background: exceeded ? '#fee2e2' : color + '18',
            border: `1.5px solid ${exceeded ? '#fca5a5' : color + '35'}`,
            padding: '2px 9px', borderRadius: 6
          }}>{metal}</span>
          <span style={{ fontSize: 13, color: 'var(--text-500)' }}>{value.toFixed(4)} <span style={{ color: 'var(--text-300)' }}>mg/L</span></span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="metric-block-value" style={{ color: exceeded ? '#dc2626' : color, fontSize: 15 }}>
            Qn = {qn?.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-400)', fontWeight: 500 }}>Limit: {standard} mg/L</div>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: exceeded
            ? 'linear-gradient(90deg, #f87171, #dc2626)'
            : `linear-gradient(90deg, ${color}cc, ${color})`
        }} />
      </div>
      {exceeded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>
          <AlertTriangle size={11} />
          Exceeds WHO limit by ×{ratio.toFixed(1)} ({((ratio - 1) * 100).toFixed(0)}% over)
        </div>
      )}
    </div>
  );
}

// ─── Formula Card ─────────────────────────────────────────────────
export function FormulaCard({ title, formula, description, color = '#2563eb' }) {
  return (
    <div className="formula-card" style={{ '--card-accent-color': color }}>
      <div className="formula-title">
        <div className="formula-dot" style={{ background: color }} />
        {title}
      </div>
      <div className="formula-code">{formula}</div>
      <p className="formula-desc">{description}</p>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────
export function Section({ title, subtitle, icon, children, actions }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <div className="section-header">
        <div>
          <div className="section-title">
            <div className="section-line" />
            {icon && <span style={{ color: 'var(--blue-500)' }}>{icon}</span>}
            {title}
          </div>
          {subtitle && <p style={{ fontSize: 13, color: 'var(--text-400)', marginTop: 4, marginLeft: 16 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────
export function KPICard({ label, value, sub, color, icon, bg }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon-wrap" style={{ background: bg || color + '20' }}>
        <span style={{ color, fontSize: 18 }}>{icon}</span>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub" style={{ color }}>{sub}</div>}
      <div className="kpi-bg-blob" style={{ background: color }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-sub">{description}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
