import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LeafletTooltip, Circle, Polygon } from 'react-leaflet';
import { MOCK_SAMPLES, runFullAnalysis, WHO_STANDARDS } from '../utils/hmpiEngine';
import { HMPIGauge } from './SharedComponents';
import { generateHMPIPdfReport } from '../utils/pdfGenerator';
import { Map, Layers, Flame, FileDown, Info, ShieldAlert, Sparkles, X, Droplets, Wrench, CheckCircle } from 'lucide-react';

const CLASS_COLORS = { safe: '#10b981', moderate: '#f59e0b', high: '#f97316', critical: '#dc2626' };

// Regional Contamination Risk Heat Zones (Smooth Gradient Heatmap Rings)
const REGIONAL_HEAT_ZONES = [
  {
    name: 'Gangetic Plains (UP & Bihar)', risk: 'Critical Risk Zone', color: '#dc2626', opacity: 0.25,
    avgHMPI: 200.4, center: [26.0, 82.5], radiusMeters: 280000,
    description: 'High Gangetic Arsenic (As) & Tannery Chromium (Cr) industrial belt.',
  },
  {
    name: 'North-West Industrial Belt (Delhi NCR & Haryana)', risk: 'High Risk Zone', color: '#f97316', opacity: 0.22,
    avgHMPI: 172.1, center: [28.6, 77.2], radiusMeters: 180000,
    description: 'Yamuna floodplains heavy metal runoff & electroplating waste.',
  },
  {
    name: 'Gujarat Chemical Corridor (Vapi-Ankleshwar)', risk: 'High Risk Zone', color: '#f97316', opacity: 0.24,
    avgHMPI: 168.4, center: [21.5, 72.9], radiusMeters: 170000,
    description: 'Chemical industrial sludge elevation of Cadmium (Cd) & Lead (Pb).',
  },
  {
    name: 'Mumbai-Thane Industrial Belt', risk: 'High Risk Zone', color: '#f97316', opacity: 0.22,
    avgHMPI: 155.8, center: [19.1, 72.9], radiusMeters: 120000,
    description: 'Heavy metal runoff (Lead, Chromium, Cadmium) near industrial estates.',
  },
  {
    name: 'Central Mining Basin (Chhattisgarh & Odisha)', risk: 'Moderate Risk Zone', color: '#f59e0b', opacity: 0.20,
    avgHMPI: 135.0, center: [21.2, 82.0], radiusMeters: 220000,
    description: 'Iron (Fe) & Manganese (Mn) mining runoff from steel plant slag.',
  },
  {
    name: 'Southern Tech-Industrial Corridor (BLR-CHN-HYD)', risk: 'Moderate Risk Zone', color: '#f59e0b', opacity: 0.18,
    avgHMPI: 118.5, center: [14.5, 78.5], radiusMeters: 290000,
    description: 'E-waste & electroplating Chromium/Nickel urban runoff.',
  },
  {
    name: 'South Coastal Aquifer Zone (Kerala & Coastal TN)', risk: 'Safe Zone', color: '#10b981', opacity: 0.18,
    avgHMPI: 76.5, center: [10.0, 76.5], radiusMeters: 190000,
    description: 'High monsoon aquifer recharge maintaining safe HMPI compliance.',
  },
];

// Rich Descriptions & Remediation Plans per City
const CITY_DETAILS_DATABASE = {
  'Patna, Bihar': {
    description: 'Patna district exhibits high Arsenic (As = 0.025 mg/L) and Iron (Fe = 0.88 mg/L) levels in shallow aquifers (30–50m) due to natural alluvial sediment dissolution along the Ganges river bed.',
    lastUpdated: '12 March 2025',
    aqiQuality: 'Unsafe for direct drinking',
    treatmentSteps: [
      'Deploy Point-of-Use Activated Alumina Filters for household drinking.',
      'Construct community Iron & Arsenic Removal Plants (IARPs).',
      'Drill deeper tube-wells into confined deeper aquifers (>100m depth).',
    ],
  },
  'Kanpur, UP': {
    description: 'Kanpur Industrial zone suffers from heavy Chromium (Cr = 0.065 mg/L) and Lead (Pb = 0.032 mg/L) contamination driven by tannery effluent discharge and untreated industrial sludge.',
    lastUpdated: '14 March 2025',
    aqiQuality: 'Critical Contamination Breach',
    treatmentSteps: [
      'Enforce zero liquid discharge (ZLD) at all leather tanneries.',
      'Install Cation/Anion Exchange Resins & RO systems at municipal waterworks.',
      'Avoid using open well water for cooking or agricultural irrigation.',
    ],
  },
  'Bhilai, Chhattisgarh': {
    description: 'Bhilai urban region shows elevated Iron (Fe = 2.8 mg/L) and Chromium (Cr = 0.12 mg/L) attributed to steel plant slag runoff and mining activities.',
    lastUpdated: '18 March 2025',
    aqiQuality: 'Moderate-High Industrial Risk',
    treatmentSteps: [
      'Install catalytic oxidation filters (Pyrolusite/Greensand) to precipitate Iron.',
      'Apply chemical coagulation with lime softening for industrial wastewater.',
    ],
  },
  'Jodhpur, Rajasthan': {
    description: 'Jodhpur deep aquifers show low overall heavy metal risk (HMPI = 64.2), though high total dissolved solids (TDS) and hardness exist in arid pockets.',
    lastUpdated: '01 April 2025',
    aqiQuality: 'Safe Heavy Metal Index',
    treatmentSteps: [
      'Standard RO desalination for domestic TDS reduction.',
      'Maintain quarterly hydrogeological surveillance.',
    ],
  },
  'Vapi, Gujarat': {
    description: 'Vapi chemical estate groundwater contains dangerous levels of Lead (Pb = 0.055 mg/L), Cadmium (Cd = 0.011 mg/L), and Mercury (Hg = 0.012 mg/L).',
    lastUpdated: '05 April 2025',
    aqiQuality: 'Extreme Toxic Risk',
    treatmentSteps: [
      'EMERGENCY: Halt all domestic groundwater pumping immediately.',
      'Supply piped canal water to affected residential colonies.',
      'Deploy Thiol-functionalized resins & Nano-filtration purifiers.',
    ],
  },
  'Alappuzha, Kerala': {
    description: 'Alappuzha coastal region groundwater is overall safe (HMPI = 78.4) with slight localized Iron elevation due to peat soil oxidation.',
    lastUpdated: '08 April 2025',
    aqiQuality: 'Safe Drinking Quality',
    treatmentSteps: [
      'Use simple sand-charcoal aeration household filters.',
      'Regular chlorination for bacterial safety in open wells.',
    ],
  },
};

export default function MapTab({ extraResults = [] }) {
  const [allSamples, setAllSamples] = useState([]);
  const [selected, setSelected] = useState(null);
  const [colorBy, setColorBy] = useState('hmpi');
  const [showStateRisk, setShowStateRisk] = useState(true);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const analysed = MOCK_SAMPLES.map(s => ({ ...runFullAnalysis(s), sample_info: s }));
    setAllSamples([...analysed, ...extraResults]);
    setLoaded(true);
  }, [extraResults]);

  const getColor = (result) => {
    if (colorBy === 'hmpi') return CLASS_COLORS[result.hmpi?.classification?.class] || '#2563eb';
    if (colorBy === 'hei') return CLASS_COLORS[result.hei?.classification?.class] || '#2563eb';
    if (colorBy === 'cd') return CLASS_COLORS[result.cd?.classification?.class] || '#2563eb';
    return '#2563eb';
  };

  const getRadius = (result) => {
    const v = result.hmpi?.value || 50;
    return Math.max(10, Math.min(32, v / 8));
  };

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500, color: 'var(--text-400)' }}>
      <div className="spinner" style={{ marginRight: 12 }} /> Loading GIS map parameters...
    </div>
  );

  const activeCityInfo = selected ? CITY_DETAILS_DATABASE[selected.location || selected.sample_info?.location] || {
    description: `Groundwater station at ${selected.location || selected.sample_id}. Evaluated using WHO 2017 drinking water standards.`,
    lastUpdated: selected.timestamp?.split('T')[0] || '2025-04-10',
    aqiQuality: selected.hmpi?.classification?.label || 'Analyzed',
    treatmentSteps: ['Install Point-of-Use Reverse Osmosis (RO) filtration unit.', 'Conduct bi-monthly laboratory surveillance.'],
  } : null;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="section-title">
            <div className="section-line" /> State-Wise GIS Contamination Heatmap &amp; City Explorer
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-400)', marginTop: 4 }}>
            Color-coded Indian states by regional groundwater contamination risk + City stations
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowStateRisk(!showStateRisk)} className={`btn btn-sm ${showStateRisk ? 'btn-primary' : 'btn-ghost'}`}>
            <Layers size={14} /> {showStateRisk ? 'State Risk Shading (ON)' : 'State Risk Shading (OFF)'}
          </button>

          <button onClick={() => setIsHeatmapMode(!isHeatmapMode)} className={`btn btn-sm ${isHeatmapMode ? 'btn-danger' : 'btn-secondary'}`}>
            <Flame size={14} /> {isHeatmapMode ? 'Disable Heatmap' : 'GIS Radial Heatmap'}
          </button>

          <span style={{ fontSize: 13, color: 'var(--text-400)', marginLeft: 6 }}>Color by:</span>
          {['hmpi', 'hei', 'cd'].map(opt => (
            <button key={opt} onClick={() => setColorBy(opt)} className={`btn btn-sm ${colorBy === opt ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ textTransform: 'uppercase', fontSize: 11 }}>{opt}</button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Leaflet Map container */}
        <div style={{ borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)', height: 560, position: 'relative' }}>
          <MapContainer center={[22.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Regional Contamination Risk Heatmap Zones */}
            {showStateRisk && REGIONAL_HEAT_ZONES.map((zone, i) => (
              <Circle key={i} center={zone.center} radius={zone.radiusMeters}
                pathOptions={{
                  color: zone.color, fillColor: zone.color,
                  fillOpacity: zone.opacity, weight: 1.5, stroke: true
                }}>
                <LeafletTooltip sticky>
                  <strong style={{ color: '#0f172a' }}>{zone.name}</strong><br />
                  Risk Level: <span style={{ color: zone.color, fontWeight: 800 }}>{zone.risk}</span><br />
                  Average Regional HMPI: <span style={{ fontWeight: 700 }}>{zone.avgHMPI}</span><br />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{zone.description}</span>
                </LeafletTooltip>
              </Circle>
            ))}

            {/* Station Markers */}
            {allSamples.map((result, i) => {
              const lat = result.coordinates?.lat || result.sample_info?.coordinates?.lat;
              const lng = result.coordinates?.lng || result.sample_info?.coordinates?.lng;
              if (!lat || !lng) return null;
              const color = getColor(result);
              const radius = getRadius(result);
              const isCritical = result.hmpi?.value > 200;

              return (
                <g key={i}>
                  {/* GIS Heatmap Hotspot Radial Glow */}
                  {isHeatmapMode && (
                    <Circle center={[lat, lng]} radius={radius * 4000}
                      pathOptions={{
                        color: isCritical ? '#dc2626' : color,
                        fillColor: isCritical ? '#ef4444' : color,
                        fillOpacity: isCritical ? 0.38 : 0.22,
                        weight: 0,
                      }} />
                  )}

                  <CircleMarker center={[lat, lng]} radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2.5, opacity: 1 }}
                    eventHandlers={{ click: () => setSelected(result) }}>
                    <LeafletTooltip>
                      <strong style={{ color: '#0f172a' }}>{result.location || result.sample_info?.location}</strong><br />
                      HMPI: <span style={{ color, fontWeight: 700 }}>{result.hmpi?.value?.toFixed(2)}</span> ({result.hmpi?.classification?.label})<br />
                      <span style={{ fontSize: 10, color: '#2563eb' }}>Click marker for rich info &amp; PDF report</span>
                    </LeafletTooltip>
                  </CircleMarker>
                </g>
              );
            })}
          </MapContainer>
        </div>

        {/* Sidebar station details & rich city popup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Selected Station Rich Popup Modal Card */}
          {selected ? (
            <div className="card" style={{ animation: 'fadeUp 0.3s ease', border: '2px solid #2563eb', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    📍 {selected.location || selected.sample_info?.location}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    ID: <code>{selected.sample_id}</code> · Date: <strong>{activeCityInfo.lastUpdated}</strong>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#64748b" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px' }}>
                <HMPIGauge value={selected.hmpi?.value} size={110} />
                <div style={{ flex: 1 }}>
                  <span className={`badge ${selected.hmpi?.classification?.class === 'safe' ? 'badge-safe' : 'badge-critical'}`}>
                    {activeCityInfo.aqiQuality}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-500)', marginTop: 8, lineHeight: 1.5 }}>
                    <strong>Coordinates:</strong> {selected.coordinates?.lat || 25.5}° N, {selected.coordinates?.lng || 85.1}° E
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-500)', marginTop: 2 }}>
                    <strong>Well Depth:</strong> {selected.depth || selected.sample_info?.depth || '45'} meters
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6, marginBottom: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px' }}>
                <strong style={{ color: '#166534' }}>Regional Description:</strong><br />
                {activeCityInfo.description}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  🛠️ How to Treat Water &amp; Ways to Cope:
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  {activeCityInfo.treatmentSteps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                  ))}
                </ul>
              </div>

              <button className="btn btn-primary btn-full" onClick={() => generateHMPIPdfReport(selected)}>
                <FileDown size={16} /> Download Full PDF Report for {selected.location || selected.sample_id}
              </button>
            </div>
          ) : (
            /* GIS Legend & State Risk Breakdown */
            <div className="card">
              <div className="card-title" style={{ fontSize: 15, marginBottom: 12 }}>
                <Layers size={16} color="#2563eb" /> State-Wise Contamination Heatmap Legend
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Uttar Pradesh (HMPI 215.6)', status: 'Critical Tannery Chromium/Lead', color: '#dc2626' },
                  { label: 'Bihar (HMPI 184.2)', status: 'High Gangetic Arsenic Risk', color: '#dc2626' },
                  { label: 'Gujarat (HMPI 168.4)', status: 'Vapi Industrial Effluents', color: '#f97316' },
                  { label: 'Chhattisgarh (HMPI 135.0)', status: 'Mining Iron & Manganese', color: '#f59e0b' },
                  { label: 'Rajasthan (HMPI 112.8)', status: 'Arid Salinity & Fluoride', color: '#f59e0b' },
                  { label: 'Kerala (HMPI 76.5)', status: 'Monsoon Safe Coastal Aquifers', color: '#10b981' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, background: '#f8faff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
                      <strong style={{ color: '#0f172a' }}>{s.label}</strong>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{s.status}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#1e40af', border: '1px solid #bfdbfe' }}>
                💡 <strong>Click any city marker on the map</strong> to open full details, contamination descriptions, treatment guidelines, and PDF export!
              </div>
            </div>
          )}

          {/* All Stations Summary List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid var(--border)', background: '#f8faff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: 14 }}>Groundwater Stations ({allSamples.length})</div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Click to inspect</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 220 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>STATION</th>
                    <th style={{ textAlign: 'right' }}>HMPI</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {allSamples.map((r, i) => {
                    const color = getColor(r);
                    const cls = r.hmpi?.classification;
                    return (
                      <tr key={i} onClick={() => setSelected(r)}
                        style={{ cursor: 'pointer', background: selected?.sample_id === r.sample_id ? '#eff6ff' : 'transparent', transition: 'background 0.2s' }}>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--text-900)', fontWeight: 600 }}>{r.location || r.sample_info?.location}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-400)', fontFamily: 'JetBrains Mono' }}>{r.sample_id}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 800, color }}>
                          {r.hmpi?.value?.toFixed(1)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${cls?.class === 'safe' ? 'badge-safe' : 'badge-high'}`}>{cls?.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
