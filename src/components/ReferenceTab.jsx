import { WHO_STANDARDS, METAL_COLORS } from '../utils/hmpiEngine';
import { FormulaCard } from './SharedComponents';
import { BookOpen, FlaskConical, Shield, Globe, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CLASSIFICATION_TABLES = [
  { index: 'HMPI', ranges: [{ range: '< 100', class: 'Safe', color: '#00b894', desc: 'Groundwater is safe for drinking (WHO standards met).' }, { range: '100 – 200', class: 'Moderate', color: '#fdcb6e', desc: 'Slight contamination present; monitoring recommended.' }, { range: '200 – 300', class: 'High Risk', color: '#e17055', desc: 'Not suitable for drinking; treatment required.' }, { range: '> 300', class: 'Critical', color: '#d63031', desc: 'Severely contaminated; immediate intervention needed.' }], ref: 'Prasad & Bose (2001); Tiwari et al. (2014)' },
  { index: 'HEI', ranges: [{ range: '< 10', class: 'Low', color: '#00b894', desc: 'Low cumulative heavy metal load.' }, { range: '10 – 20', class: 'Medium', color: '#fdcb6e', desc: 'Medium metal load; some risk.' }, { range: '> 20', class: 'High', color: '#d63031', desc: 'High metal load; unacceptable for drinking.' }], ref: 'Edet & Offiong (2002)' },
  { index: 'Contamination Factor (CF)', ranges: [{ range: '< 1', class: 'Low', color: '#00b894', desc: 'Concentration below background.' }, { range: '1 – 3', class: 'Moderate', color: '#fdcb6e', desc: 'Moderate enrichment over background.' }, { range: '3 – 6', class: 'Considerable', color: '#e17055', desc: 'Considerable contamination.' }, { range: '> 6', class: 'Very High', color: '#d63031', desc: 'Very high contamination.' }], ref: 'Hakanson (1980)' },
  { index: 'Degree of Contamination (Cd)', ranges: [{ range: '< 1', class: 'Low', color: '#00b894', desc: 'Low degree of contamination.' }, { range: '1 – 3', class: 'Moderate', color: '#fdcb6e', desc: 'Moderate contamination.' }, { range: '3 – 6', class: 'High', color: '#e17055', desc: 'High contamination; urgent treatment.' }, { range: '> 6', class: 'Very High', color: '#d63031', desc: 'Extreme contamination.' }], ref: 'Hakanson (1980)' },
  { index: 'Hazard Index (HI)', ranges: [{ range: '< 1', class: 'Acceptable', color: '#00b894', desc: 'No significant non-carcinogenic risk via oral ingestion.' }, { range: '> 1', class: 'Unacceptable', color: '#d63031', desc: 'Non-carcinogenic risk above acceptable threshold.' }], ref: 'US-EPA (2004)' },
];

const HEALTH_EFFECTS = [
  { metal: 'As', color: METAL_COLORS.As, disease: 'Arsenicosis, skin cancer, keratosis, cardiovascular disease', source: 'Geological weathering, pesticides, industrial effluents' },
  { metal: 'Pb', color: METAL_COLORS.Pb, disease: 'Neurotoxicity, developmental delays, kidney damage, hypertension', source: 'Old plumbing, industrial smelters, vehicle exhaust' },
  { metal: 'Cd', color: METAL_COLORS.Cd, disease: 'Itai-itai disease, kidney tubular dysfunction, bone demineralization', source: 'Fertilizers, electroplating, pigments' },
  { metal: 'Cr', color: METAL_COLORS.Cr, disease: 'Lung cancer, nasal perforation, liver damage', source: 'Tanneries, steel manufacturing, chrome plating' },
  { metal: 'Mn', color: METAL_COLORS.Mn, disease: 'Manganism (Parkinson-like), neurological damage', source: 'Mining, welding, groundwater dissolution' },
  { metal: 'Hg', color: METAL_COLORS.Hg, disease: 'Minamata disease, neurological damage, kidney failure', source: 'Chlor-alkali plants, gold mining, thermometers' },
  { metal: 'Ni', color: METAL_COLORS.Ni, disease: 'Lung cancer, contact dermatitis, kidney damage', source: 'Electroplating, stainless steel, batteries' },
  { metal: 'Cu', color: METAL_COLORS.Cu, disease: 'Wilson\'s disease, GI irritation, liver cirrhosis', source: 'Plumbing corrosion, mining, fungicides' },
];

export default function ReferenceTab() {
  return (
    <div>
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,184,148,0.05))', borderColor: 'rgba(0,212,255,0.3)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 40 }}>🔬</div>
          <div>
            <div className="card-title" style={{ fontSize: 20, marginBottom: 8 }}>Scientific Methodology & Reference Standards</div>
            <p style={{ fontSize: 14, color: '#4a6680', lineHeight: 1.8, maxWidth: 800 }}>
              This application implements internationally recognized Heavy Metal Pollution Index (HMPI) formulae as standardized by the <strong style={{ color: '#8fafc8' }}>WHO (World Health Organization)</strong>, <strong style={{ color: '#8fafc8' }}>BIS (Bureau of Indian Standards IS:10500)</strong>, and peer-reviewed hydrogeological literature (Prasad & Bose, 2001; Tiwari et al., 2014; Hakanson, 1980; US-EPA RAGS framework). All indices are computed using observed laboratory concentrations in mg/L against maximum allowable concentration (MAC) thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* Formulas */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title" style={{ marginBottom: 16 }}><FlaskConical size={20} /> Index Formulas & Computation Methods</div>
        <div className="grid-3">
          <FormulaCard title="Heavy Metal Pollution Index (HMPI)" formula="HMPI = Σ [ 100 × (Cn / Sn) ] / n" description="n = number of metals; Cn = observed concentration (mg/L); Sn = WHO permissible limit. Quotient Qn = 100×Cn/Sn represents the proportion relative to the standard." color="#00d4ff" />
          <FormulaCard title="Heavy Metal Evaluation Index (HEI)" formula="HEI = Σ (Cn / Smac)" description="Smac = Maximum admissible concentration (WHO standard). Measures the cumulative deviation of all metal concentrations from their safety thresholds." color="#00b894" />
          <FormulaCard title="Contamination Factor (CF)" formula="CF_i = C_observed / C_background" description="C_background = WHO/BIS permissible standard when natural background is unknown. CF < 1: low; 1–3: moderate; 3–6: considerable; >6: very high contamination." color="#fdcb6e" />
          <FormulaCard title="Degree of Contamination (Cd)" formula="Cd = Σ CF_i − n" description="Accounts for the number of metals analyzed. Subtracting n normalizes the index for fair comparison across different studies with varying parameter sets." color="#e17055" />
          <FormulaCard title="Non-Carcinogenic Risk (HQ, HI)" formula="CDI = Cn × IR × EF × ED / (BW × AT)\nHQ = CDI / RfD\nHI = Σ HQ" description="CDI = Chronic Daily Intake; RfD = Reference Dose; IR = Ingestion rate; EF = Exposure frequency; ED = Exposure duration; BW = Body weight; AT = Averaging time." color="#6c5ce7" />
          <FormulaCard title="Carcinogenic Risk (CR)" formula="CR = CDI × SF" description="SF = Cancer Slope Factor (US-EPA). CR < 1×10⁻⁶: negligible risk; 10⁻⁶–10⁻⁴: acceptable range; CR > 10⁻⁴: unacceptable carcinogenic risk." color="#d63031" />
        </div>
      </div>

      {/* Classification Tables */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title" style={{ marginBottom: 16 }}><BookOpen size={20} /> Index Classification Thresholds</div>
        {CLASSIFICATION_TABLES.map((ct, i) => (
          <div key={i} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="card-title" style={{ fontSize: 16 }}>{ct.index}</div>
              <span style={{ fontSize: 11, color: '#4a6680', fontStyle: 'italic' }}>Ref: {ct.ref}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {ct.ranges.map((r, j) => (
                <div key={j} style={{ background: r.color + '10', border: `1px solid ${r.color}30`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.range}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4fd', marginBottom: 4 }}>{r.class}</div>
                  <div style={{ fontSize: 12, color: '#4a6680', lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* WHO/BIS Standards Table */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title" style={{ marginBottom: 16 }}><Globe size={20} /> WHO & BIS Drinking Water Standards</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>METAL</th>
                <th>FULL NAME</th>
                <th>WHO LIMIT (mg/L)</th>
                <th>BIS LIMIT (mg/L)</th>
                <th>HEALTH RISK</th>
                <th>ATOMIC WEIGHT</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(WHO_STANDARDS).map(([metal, s]) => (
                <tr key={metal}>
                  <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: METAL_COLORS[metal], background: METAL_COLORS[metal] + '15', padding: '3px 10px', borderRadius: 6 }}>{metal}</span></td>
                  <td style={{ fontFamily: 'Inter', color: '#e8f4fd' }}>{s.name}</td>
                  <td style={{ color: '#00d4ff' }}>{s.who_permissible}</td>
                  <td style={{ color: '#00b894' }}>{s.bis_permissible}</td>
                  <td style={{ color: '#e17055', fontSize: 12 }}>{s.health_risk}</td>
                  <td style={{ color: '#4a6680' }}>{s.atomic_weight} g/mol</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Effects */}
      <div>
        <div className="section-title" style={{ marginBottom: 16 }}><Shield size={20} /> Health Effects & Major Sources of Heavy Metal Contamination</div>
        <div className="grid-2">
          {HEALTH_EFFECTS.map((h, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${h.color}`, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 800, color: h.color }}>{h.metal}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#e8f4fd' }}>{WHO_STANDARDS[h.metal]?.name}</span>
              </div>
              <div style={{ fontSize: 13, color: '#8fafc8', lineHeight: 1.6, marginBottom: 8 }}>
                <span style={{ color: '#d63031', fontWeight: 600 }}>Disease: </span>{h.disease}
              </div>
              <div style={{ fontSize: 12, color: '#4a6680', lineHeight: 1.6 }}>
                <span style={{ color: '#fdcb6e', fontWeight: 600 }}>Sources: </span>{h.source}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Government & International Ministry Links */}
      <div className="card mt-24" style={{ background: '#f8fafc', borderColor: '#bfdbfe' }}>
        <div className="card-title" style={{ fontSize: 16, marginBottom: 12, color: '#1e40af' }}>
          🌐 Official Ministry &amp; Government Water Portals
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { name: 'Ministry of Jal Shakti', url: 'https://jalshakti-dowr.gov.in/', desc: 'Department of Water Resources, Govt of India' },
            { name: 'Central Ground Water Board (CGWB)', url: 'http://cgwb.gov.in/', desc: 'National Hydrogeological Monitoring Network' },
            { name: 'Central Pollution Control Board (CPCB)', url: 'https://cpcb.nic.in/', desc: 'Environmental Quality & Effluent Standards' },
            { name: 'WHO Water Quality Guidelines', url: 'https://www.who.int/water_sanitation_health/water-quality/', desc: 'Global Drinking Water Standards (4th Ed)' },
            { name: 'Bureau of Indian Standards (BIS)', url: 'https://bis.gov.in/', desc: 'IS 10500:2012 Drinking Water Specs' },
          ].map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', padding: '12px 14px', background: '#ffffff',
                border: '1.5px solid #dce4ef', borderRadius: 12, textDecoration: 'none',
                transition: 'all 0.18s'
              }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {link.name} <Globe size={14} />
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>{link.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="card mt-24" style={{ background: '#ffffff' }}>
        <div className="card-title" style={{ fontSize: 15, marginBottom: 12 }}><BookOpen size={16} /> Key Peer-Reviewed References</div>
        {[
          'Prasad, B., & Bose, J.M. (2001). Evaluation of the heavy metal pollution index for surface and spring water near a limestone mining area of the lower Himalayas.',
          'Tiwari, A.K., et al. (2014). Evaluation of metal contamination in coal mine groundwater: A case study from the Johilla coalfield area.',
          'Hakanson, L. (1980). An ecological risk index for aquatic pollution control. A sedimentological approach. Water Research, 14(8), 975-1001.',
          'US-EPA (2004). Risk Assessment Guidance for Superfund (RAGS). Volume I: Human Health Evaluation Manual.',
          'WHO (2017). Guidelines for Drinking-water Quality: Fourth Edition Incorporating the First Addendum.',
          'Bureau of Indian Standards (2012). IS 10500:2012 Drinking Water Specification.',
          'Edet, A.E., & Offiong, O.E. (2002). Evaluation of water quality pollution indices for heavy metal contamination monitoring.',
        ].map((ref, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text-500)', lineHeight: 1.6, paddingLeft: 16, borderLeft: '2px solid #2563eb', marginBottom: 10 }}>{ref}</div>
        ))}
      </div>
    </div>
  );
}
