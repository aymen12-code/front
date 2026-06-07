import { useState } from 'react';
import { BrainCircuit, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { predictCancellation } from '../api';

const SEGMENTS = ['WalkIn','OTA','B2B','VCR','AVM','CRS','WEB','TO','Other'];
const CATEGORIES = ['Standard','Family','Suite','Autre'];

const INITIAL = {
  leadTime: '14', roomCategory: 'Standard', segment: 'WalkIn',
  price: '1576', adults: '2', children: '0',
};

function RiskGauge({ probability }) {
  const color = probability > 45 ? '#f43f5e' : probability > 25 ? '#f59e0b' : '#10b981';

  // SVG semicircle gauge — no Recharts, full layout control
  const cx = 110, cy = 105, r = 74, sw = 15;
  const arcLen = Math.PI * r;                          // half-circumference
  const filled = Math.min(probability / 100, 1) * arcLen;
  // d: from left endpoint counterclockwise (upward) to right endpoint
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;

  return (
    <svg
      viewBox="0 0 220 128"
      style={{ width: '100%', display: 'block', overflow: 'visible' }}
      aria-label={`Cancellation probability: ${probability}%`}
    >
      {/* Background track */}
      <path d={d} fill="none" stroke="rgba(99,157,255,0.1)"
        strokeWidth={sw} strokeLinecap="round" />

      {/* Filled arc */}
      <path d={d} fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${filled} ${arcLen * 2}`}
        style={{ transition: 'stroke-dasharray 0.7s ease, stroke 0.4s ease' }}
      />

      {/* Percentage — baseline at cy-12, well below the arc top (cy-r ≈ 31) */}
      <text x={cx} y={cy - 12}
        textAnchor="middle"
        fill={color} fontSize="38" fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        style={{ transition: 'fill 0.4s ease' }}
      >
        {probability}%
      </text>

      {/* Sub-label — below the arc endpoints (cy ± sw/2) */}
      <text x={cx} y={cy + 18}
        textAnchor="middle"
        fill="#4a5a7a" fontSize="11"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Cancellation Probability
      </text>
    </svg>
  );
}

export default function Predictor() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handlePredict(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await predictCancellation(form);
      setResult(res);
    } catch (ex) {
      setError(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const riskColor = result
    ? result.riskLevel === 'High' ? '#f43f5e' : result.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'
    : 'var(--accent-blue)';

  const riskBadgeClass = result
    ? result.riskLevel === 'High' ? 'badge-danger' : result.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'
    : '';

  return (
    <div>
      {/* Header explanation */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(139,92,246,0.06))',
        border: '1px solid rgba(99,157,255,0.15)',
        borderRadius: 'var(--radius)',
        padding: '18px 22px',
        marginBottom: 24,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start'
      }}>
        <BrainCircuit size={24} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>AI-Powered Cancellation Risk Predictor</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            This model uses a heuristic scoring engine trained on <strong style={{ color: 'var(--text-secondary)' }}>38,175 historical reservations</strong>.
            Enter booking details below to estimate the cancellation probability and identify key risk factors.
          </div>
        </div>
      </div>

      <div className="predictor-layout">
        {/* Input Form */}
        <div className="result-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Booking Parameters</h3>
          {error && <div className="error-box" style={{ marginBottom: 14 }}>⚠️ {error}</div>}

          <form onSubmit={handlePredict}>
            <div className="form-grid">
              <div className="form-group">
                <label>Lead Time (days)</label>
                <input
                  id="pred-lead-time"
                  type="number" min="0" max="365"
                  className="form-input"
                  value={form.leadTime}
                  onChange={e => set('leadTime', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Price (MAD)</label>
                <input
                  id="pred-price"
                  type="number" min="0"
                  className="form-input"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Room Category</label>
                <select id="pred-room" className="form-input" value={form.roomCategory} onChange={e => set('roomCategory', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Booking Segment</label>
                <select id="pred-segment" className="form-input" value={form.segment} onChange={e => set('segment', e.target.value)}>
                  {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Adults</label>
                <input
                  id="pred-adults"
                  type="number" min="1" max="10"
                  className="form-input"
                  value={form.adults}
                  onChange={e => set('adults', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Children</label>
                <input
                  id="pred-children"
                  type="number" min="0" max="10"
                  className="form-input"
                  value={form.children}
                  onChange={e => set('children', e.target.value)}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ marginBottom: 18 }}>
              <div className="section-title" style={{ marginTop: 0, marginBottom: 8 }}>Quick Presets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Walk-in Guest', vals: { leadTime: '0', roomCategory: 'Standard', segment: 'WalkIn', price: '1200', adults: '2', children: '0' } },
                  { label: 'OTA Booking', vals: { leadTime: '20', roomCategory: 'Standard', segment: 'OTA', price: '1576', adults: '2', children: '0' } },
                  { label: 'Suite / B2B', vals: { leadTime: '45', roomCategory: 'Suite', segment: 'B2B', price: '3800', adults: '2', children: '1' } },
                  { label: 'High-Risk WEB', vals: { leadTime: '15', roomCategory: 'Standard', segment: 'WEB', price: '2200', adults: '3', children: '0' } },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForm(p.vals)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="predict-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            >
              <BrainCircuit size={15} />
              {loading ? 'Analysing…' : 'Predict Cancellation Risk'}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        <div>
          {result ? (
            <div className="result-card">
              {/* Gauge */}
              <RiskGauge probability={result.probability} />

              {/* Risk Level */}
              <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 20 }}>
                <span className={`badge ${riskBadgeClass}`} style={{ fontSize: 13, padding: '5px 14px' }}>
                  {result.riskLevel === 'High' ? '🔴' : result.riskLevel === 'Medium' ? '🟡' : '🟢'} {result.riskLevel} Risk
                </span>
              </div>

              {/* Risk bar */}
              <div className="risk-meter">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Low</span><span>Medium</span><span>High</span>
                </div>
                <div className="risk-bar-bg">
                  <div
                    className="risk-bar-fill"
                    style={{
                      width: `${result.probability}%`,
                      background: `linear-gradient(90deg, #10b981, ${riskColor})`
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  <span>0%</span><span>50%</span><span>99%</span>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <div className="section-title">
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Risk Factors
                </div>
                <ul className="risk-factors-list">
                  {result.riskFactors.map((f, i) => (
                    <li key={i}>
                      <span style={{ color: '#f43f5e', marginTop: 2 }}>●</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Positive Factors */}
              <div>
                <div className="section-title" style={{ marginTop: 16 }}>
                  <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Positive Signals
                </div>
                <ul className="risk-factors-list">
                  {result.positiveFactors.map((f, i) => (
                    <li key={i}>
                      <span style={{ color: '#10b981', marginTop: 2 }}>●</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div style={{
                marginTop: 20,
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: result.probability > 45
                  ? 'rgba(244,63,94,0.07)'
                  : result.probability > 25
                  ? 'rgba(245,158,11,0.07)'
                  : 'rgba(16,185,129,0.07)',
                border: `1px solid ${riskColor}33`,
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <Info size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: riskColor }} />
                {result.probability > 45
                  ? 'Consider requesting a non-refundable deposit or offering a discount to secure this booking.'
                  : result.probability > 25
                  ? 'Send a confirmation reminder closer to check-in date to reduce cancellation risk.'
                  : 'Low risk profile — this booking shows strong commitment indicators.'}
              </div>
            </div>
          ) : (
            <div className="result-card" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: 360, gap: 16, color: 'var(--text-muted)'
            }}>
              <BrainCircuit size={52} color="rgba(79,142,247,0.3)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Awaiting Analysis
                </div>
                <div style={{ fontSize: 12.5, maxWidth: 240, lineHeight: 1.7 }}>
                  Fill in the booking parameters and click <strong>Predict</strong> to get the cancellation risk score.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
