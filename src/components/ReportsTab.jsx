import { useState, useRef } from 'react';
import { MOCK_SAMPLES, runFullAnalysis, WHO_STANDARDS, METAL_COLORS } from '../utils/hmpiEngine';
import { generateHMPIPdfReport } from '../utils/pdfGenerator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';
import { FileUp, FileDown, Table2, ChevronRight, RefreshCw, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1.5px solid #dce4ef', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 12, color: '#7a8fa6', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || '#1a6ef7' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>)}
    </div>
  );
};

const CLASS_MAP = { safe: 'badge-safe', moderate: 'badge-moderate', high: 'badge-high', critical: 'badge-critical' };
const CLASS_COLORS_MAP = { safe: '#00b894', moderate: '#fdcb6e', high: '#e17055', critical: '#d63031' };

export default function ReportsTab({ extraResults = [] }) {
  const [results, setResults] = useState(() => MOCK_SAMPLES.map(s => ({ ...runFullAnalysis(s), raw: s })));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('hmpi');
  const fileRef = useRef();

  const allResults = [...results, ...extraResults];

  const filtered = allResults.filter(r => {
    const loc = (r.location || r.sample_info?.location || '').toLowerCase();
    const id = (r.sample_id || '').toLowerCase();
    const q = search.toLowerCase();
    if (search && !loc.includes(q) && !id.includes(q)) return false;
    if (filter === 'all') return true;
    return r.hmpi?.classification?.class === filter;
  }).sort((a, b) => {
    if (sortBy === 'hmpi') return (b.hmpi?.value || 0) - (a.hmpi?.value || 0);
    if (sortBy === 'hei') return (b.hei?.value || 0) - (a.hei?.value || 0);
    if (sortBy === 'id') return (a.sample_id || '').localeCompare(b.sample_id || '');
    return 0;
  });

  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const newSamples = data.map((row, i) => {
          const conc = {};
          Object.keys(WHO_STANDARDS).forEach(m => { if (row[m] && !isNaN(parseFloat(row[m]))) conc[m] = row[m]; });
          return {
            id: row.sample_id || `CSV-${i + 1}`,
            location: row.location || `Site ${i + 1}`,
            coordinates: { lat: parseFloat(row.lat) || 20.5937, lng: parseFloat(row.lng) || 78.9629 },
            depth: row.depth, source_type: row.source_type || 'Borewell', date: row.date || new Date().toISOString().split('T')[0],
            concentrations: conc,
          };
        }).filter(s => Object.keys(s.concentrations).length > 0);
        const analysed = newSamples.map(s => ({ ...runFullAnalysis(s), raw: s }));
        setResults(prev => [...prev, ...analysed]);
      },
    });
  };

  const exportCSV = () => {
    const rows = filtered.map(r => ({
      sample_id: r.sample_id,
      location: r.location || r.sample_info?.location,
      lat: r.coordinates?.lat || '',
      lng: r.coordinates?.lng || '',
      hmpi: r.hmpi?.value?.toFixed(4),
      hmpi_class: r.hmpi?.classification?.label,
      hei: r.hei?.value?.toFixed(4),
      hei_class: r.hei?.classification?.label,
      cd: r.cd?.value?.toFixed(4),
      cd_class: r.cd?.classification?.label,
      hi_adult: r.hhra?.adult?.HI?.toFixed(4),
      hi_child: r.hhra?.child?.HI?.toFixed(4),
      timestamp: r.timestamp,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'hmpi_results.csv'; a.click();
  };

  const hmpiComparisonData = filtered.slice(0, 12).map(r => ({
    name: (r.location || r.sample_id || '').split(',')[0].slice(0, 12),
    HMPI: r.hmpi?.value || 0,
    HEI: r.hei?.value || 0,
    Cd: r.cd?.value || 0,
    fill: CLASS_COLORS_MAP[r.hmpi?.classification?.class] || '#00d4ff',
  }));

  const stats = { total: allResults.length, safe: allResults.filter(r => r.hmpi?.classification?.class === 'safe').length, moderate: allResults.filter(r => r.hmpi?.classification?.class === 'moderate').length, high: allResults.filter(r => r.hmpi?.classification?.class === 'high').length, critical: allResults.filter(r => r.hmpi?.classification?.class === 'critical').length };

  return (
    <div>
      {/* Stats Row */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Total Samples', val: stats.total, color: '#00d4ff', icon: '🧪' },
          { label: 'Safe Stations', val: stats.safe, color: '#00b894', icon: '✅' },
          { label: 'Moderate Risk', val: stats.moderate, color: '#fdcb6e', icon: '⚠️' },
          { label: 'High / Critical', val: stats.high + stats.critical, color: '#d63031', icon: '🚨' },
        ].map((s, i) => (
          <div key={i} className="kpi-card" style={{ '--accent-line': s.color }}>
            <div className="kpi-label">{s.icon} {s.label}</div>
            <div className="kpi-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="card mb-24">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="card-title">HMPI Comparison Across Stations</div>
            <div className="card-subtitle">Red bars exceed safe threshold (HMPI = 100)</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={hmpiComparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#4a6680', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#4a6680', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="HMPI" name="HMPI Score" radius={[4, 4, 0, 0]}>
              {hmpiComparisonData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a6680' }} />
          <input className="form-input" placeholder="Search by location or sample ID..." style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'safe', 'moderate', 'high', 'critical'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize', fontSize: 12 }}>{f === 'all' ? 'All' : f}</button>
        ))}
        <select className="form-select" style={{ width: 140 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="hmpi">Sort: HMPI</option>
          <option value="hei">Sort: HEI</option>
          <option value="id">Sort: ID</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}><FileUp size={14} />Import CSV</button>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}><FileDown size={14} />Export CSV</button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
      </div>

      {/* Results Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>SAMPLE ID</th>
              <th>LOCATION</th>
              <th>HMPI Score</th>
              <th>HMPI Class</th>
              <th>HEI Score</th>
              <th>Cd Value</th>
              <th>HI Adult</th>
              <th>HI Child</th>
              <th>DATE</th>
              <th>REPORT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const cls = r.hmpi?.classification;
              const hiAdult = r.hhra?.adult?.HI;
              const hiChild = r.hhra?.child?.HI;
              return (
                <tr key={i}>
                  <td style={{ color: '#2563eb', fontWeight: 700 }}>{r.sample_id}</td>
                  <td style={{ color: 'var(--text-900)', fontFamily: 'Inter', fontSize: 13, fontWeight: 600 }}>{r.location || r.sample_info?.location}</td>
                  <td style={{ color: CLASS_COLORS_MAP[cls?.class] || '#2563eb', fontWeight: 800 }}>{r.hmpi?.value?.toFixed(3)}</td>
                  <td><span className={`badge ${CLASS_MAP[cls?.class] || 'badge-moderate'}`}>{cls?.label}</span></td>
                  <td style={{ color: CLASS_COLORS_MAP[r.hei?.classification?.class] || '#2563eb' }}>{r.hei?.value?.toFixed(3)}</td>
                  <td style={{ color: CLASS_COLORS_MAP[r.cd?.classification?.class] || '#2563eb' }}>{r.cd?.value?.toFixed(3)}</td>
                  <td style={{ color: hiAdult > 1 ? '#dc2626' : '#10b981', fontWeight: 700 }}>{hiAdult?.toFixed(4)}</td>
                  <td style={{ color: hiChild > 1 ? '#dc2626' : '#10b981', fontWeight: 700 }}>{hiChild?.toFixed(4)}</td>
                  <td style={{ color: 'var(--text-400)', fontSize: 12 }}>{r.timestamp?.split('T')[0] || r.raw?.date || '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => generateHMPIPdfReport(r)} style={{ padding: '4px 10px', fontSize: 11 }}>
                      <FileDown size={12} /> PDF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4a6680' }}>
            No samples match your filter criteria.
          </div>
        )}
      </div>

      {/* CSV Import Template */}
      <div className="card mt-24" style={{ background: '#ffffff', border: '1px solid #eef2f7' }}>
        <div className="card-title" style={{ fontSize: 15, color: '#1a2b3c' }}><FileUp size={16} /> CSV Import Format</div>
        <div className="card-subtitle" style={{ color: '#7a8fa6' }}>Use this column structure for bulk importing laboratory data</div>
        <div style={{ background: '#f8fafd', borderRadius: 8, padding: '12px 16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#1a6ef7', overflowX: 'auto', border: '1px solid #eef2f7' }}>
          sample_id, location, lat, lng, depth, source_type, date, As, Cd, Cr, Cu, Fe, Mn, Ni, Pb, Zn, Hg, Se, Co<br />
          GW-001, "Patna, Bihar", 25.5941, 85.1376, 45, Borewell, 2025-03-12, 0.025, 0.004, 0.035, 0.68, 0.88, 0.52, 0.04, 0.018, 2.1, 0, 0, 0
        </div>
        <div style={{ fontSize: 12, color: '#7a8fa6', marginTop: 8 }}>💡 Leave metal columns blank or 0 if not tested. Columns for metals not in the database will be ignored.</div>
      </div>
    </div>
  );
}
