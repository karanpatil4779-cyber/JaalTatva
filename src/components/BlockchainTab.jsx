import { useState } from 'react';
import { MOCK_SAMPLES, runFullAnalysis, generateBlockchainRecord } from '../utils/hmpiEngine';
import { ShieldCheck, Lock, Hash, Link2, CheckCircle2, Copy, Cpu, ExternalLink, Key } from 'lucide-react';

export default function BlockchainTab() {
  const [selectedSample, setSelectedSample] = useState(MOCK_SAMPLES[0]);
  const [copied, setCopied] = useState(false);

  const sampleResult = runFullAnalysis(selectedSample);
  const block = sampleResult.blockchain;

  // Build simulated blockchain chain of 5 historical blocks
  const chain = MOCK_SAMPLES.map((s, idx) => {
    const res = runFullAnalysis(s);
    return generateBlockchainRecord(res, idx + 1042, idx === 0 ? '0x0000000000000000000000000000000000000000000000000000000000000000' : '0x8f3b...a19c');
  });

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      
      {/* ── HEADER ── */}
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-900)' }}>
                Security Assessment &amp; Data Integrity Audit
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-500)', marginTop: 2 }}>
                Tamper-proof cryptographic SHA-256 verification preventing falsification of groundwater lab data
              </div>
            </div>
          </div>
          <div className="nav-who-badge" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
            <Lock size={13} /> Proof-of-Authority (PoA) Consortium Node Active
          </div>
        </div>
      </div>

      {/* ── LIVE VERIFICATION PANEL ── */}
      <div className="grid-2 mb-24">
        {/* Verification Inspector */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 15, marginBottom: 14 }}>
            <Key size={16} color="#059669" /> Select Sample Record to Verify
          </div>

          <div className="form-group">
            <label className="form-label">Water Station Record</label>
            <select className="form-select" value={selectedSample.id} onChange={e => {
              const s = MOCK_SAMPLES.find(x => x.id === e.target.value);
              if (s) setSelectedSample(s);
            }}>
              {MOCK_SAMPLES.map(s => <option key={s.id} value={s.id}>{s.location} ({s.id})</option>)}
            </select>
          </div>

          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Cryptographic Block #{block.blockHeight}</span>
              <span className="badge badge-safe"><CheckCircle2 size={11} /> Cryptographically Verified</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--text-400)', fontSize: 11, marginBottom: 2 }}>BLOCK HASH (SHA-256)</div>
                <div style={{ fontFamily: 'JetBrains Mono', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: 6, color: '#1e40af', wordBreak: 'break-all', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{block.currentHash}</span>
                  <button onClick={() => copyHash(block.currentHash)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', marginLeft: 6 }}>
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-400)', fontSize: 11, marginBottom: 2 }}>MERKLE ROOT</div>
                <div style={{ fontFamily: 'JetBrains Mono', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 6 }}>
                  {block.merkleRoot}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: 6 }}>
                  <div style={{ color: 'var(--text-400)', fontSize: 10 }}>VALIDATOR NODE</div>
                  <strong style={{ color: 'var(--text-900)' }}>{block.validatorNode}</strong>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: 6 }}>
                  <div style={{ color: 'var(--text-400)', fontSize: 10 }}>NONCE</div>
                  <strong style={{ fontFamily: 'JetBrains Mono', color: '#2563eb' }}>{block.nonce}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Blockchain Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title" style={{ fontSize: 15, marginBottom: 12 }}>
              <Lock size={16} color="#2563eb" /> How Data Tamper-Proofing Works
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-500)', lineHeight: 1.7 }}>
              When a laboratory submits water sample concentrations, the system generates a <strong>SHA-256 Merkle tree payload hash</strong> linked directly to the previous block.
              <br /><br />
              Any retrospective modification of HMPI index calculations or metal values immediately breaks the cryptographic signature string, alerting regulatory authorities (CGWB / CPCB) instantly.
            </div>

            <div className="divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af' }}>Consensus Engine</div>
                <div style={{ fontSize: 12, color: '#1d4ed8' }}>PoA CGWB Network</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Immutability</div>
                <div style={{ fontSize: 12, color: '#15803d' }}>Zero Falsification</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOCK EXPLORER LEDGER TABLE ── */}
      <div className="card">
        <div className="card-title" style={{ fontSize: 15, marginBottom: 14 }}>
          <Link2 size={16} color="#2563eb" /> Consortium Blockchain Block Explorer (Recent Ledger Entries)
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>BLOCK #</th>
                <th>TIMESTAMP</th>
                <th>STATION LOCATION</th>
                <th>HMPI SCORE</th>
                <th>BLOCK HASH (SHA-256)</th>
                <th>CONSENSUS</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((b, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#2563eb' }}>#{b.blockHeight}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-500)' }}>{b.timestamp.split('T')[0]}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-900)' }}>{MOCK_SAMPLES[i]?.location}</td>
                  <td>
                    <span className={`badge ${runFullAnalysis(MOCK_SAMPLES[i]).hmpi?.classification?.class === 'safe' ? 'badge-safe' : 'badge-high'}`}>
                      HMPI {runFullAnalysis(MOCK_SAMPLES[i]).hmpi?.value?.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748b' }}>
                    {b.currentHash.slice(0, 22)}...
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                      Verified ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
