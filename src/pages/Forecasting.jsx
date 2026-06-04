import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchAnalytics } from '../api';

const MONTH_NAMES = {
  '01':'Jan','02':'Fév','03':'Mar','04':'Avr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Aoû','09':'Sep','10':'Oct','11':'Nov','12':'Déc',
};

function fmtMonth(my) {
  if (!my) return '';
  const [, m] = my.split('-');
  return MONTH_NAMES[m] || m;
}

export default function Forecasting() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setAnalytics(await fetchAnalytics()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading…</p></div>;
  if (error)   return <div className="error-box">⚠️ {error}</div>;

  const monthly = (analytics?.monthly_trends ?? [])
    .sort((a, b) => a.month_year.localeCompare(b.month_year));

  const segments = (analytics?.segment ?? [])
    .sort((a, b) => b.cancellation_rate - a.cancellation_rate);

  if (!monthly.length) return <div className="error-box">No data available.</div>;

  const avgRate = monthly.reduce((s, m) => s + m.cancellation_rate, 0) / monthly.length;
  const threshold = avgRate + 0.05;
  const critical = monthly.filter(m => m.cancellation_rate > threshold);
  const peakMonth = [...monthly].sort((a, b) => b.cancellations - a.cancellations)[0];

  return (
    <div>
      {/* ── Section 1: Critical Periods ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="var(--accent-amber)" /> Périodes Critiques &amp; Indicateurs Clés
        </h2>

        {/* Alert banner */}
        <div style={{
          background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
        }}>
          <AlertTriangle size={14} color="var(--accent-rose)" />
          <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
            {critical.length} période(s) critique(s) détectée(s)
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(taux &gt; moyenne + 5%)</span>
        </div>

        {/* Critical month rows */}
        {critical.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune période critique détectée.</div>
        ) : critical.map(m => (
          <div key={m.month_year} style={{
            background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
              {fmtMonth(m.month_year)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Taux : <strong style={{ color: 'var(--text-primary)' }}>{(m.cancellation_rate * 100).toFixed(1)}%</strong>
              {' '}({m.cancellations.toLocaleString()} annulations / {m.total_bookings.toLocaleString()} réservations)
            </span>
            {m.month_year === peakMonth.month_year && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>🔴 Pic maximum</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Section 2: Monthly KPI Table ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 Tableau de bord KPIs mensuel
        </h2>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th style={{ textAlign: 'right' }}>Réservations</th>
                <th style={{ textAlign: 'right' }}>Annulations</th>
                <th style={{ textAlign: 'right' }}>Taux (%)</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map(m => {
                const isCritical = m.cancellation_rate > threshold;
                const isPeak     = m.month_year === peakMonth.month_year;
                const rate       = (m.cancellation_rate * 100).toFixed(1);
                return (
                  <tr key={m.month_year} style={isPeak ? { background: 'rgba(244,63,94,0.05)' } : {}}>
                    <td style={{
                      fontWeight: 600,
                      color: isPeak ? '#f43f5e' : 'var(--text-primary)'
                    }}>
                      {fmtMonth(m.month_year)}
                      {isPeak && <span style={{ marginLeft: 6, fontSize: 11, color: '#f43f5e' }}>▲ MAX</span>}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {m.total_bookings.toLocaleString()}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: isPeak ? 700 : 400,
                      color: isPeak ? '#f43f5e' : 'var(--text-secondary)',
                    }}>
                      {m.cancellations.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        color: isCritical ? '#f43f5e' : rate > 25 ? '#f59e0b' : 'var(--text-secondary)',
                        fontWeight: isCritical ? 700 : 400,
                      }}>
                        {rate}
                      </span>
                    </td>
                    <td>
                      {isCritical ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f43f5e', fontSize: 12.5, fontWeight: 600 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
                          Critique
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 12.5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 24, flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Moyenne : <strong style={{ color: 'var(--text-secondary)' }}>{(avgRate * 100).toFixed(1)}%</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Mois critique max : <strong style={{ color: '#f43f5e' }}>{fmtMonth(peakMonth.month_year)}</strong> ({peakMonth.cancellations.toLocaleString()} annulations)
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Total annulations : <strong style={{ color: 'var(--text-secondary)' }}>
                {monthly.reduce((s, m) => s + m.cancellations, 0).toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Segment Performance ── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          🏷️ Performance par segment
        </h2>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Segment</th>
                <th style={{ textAlign: 'right' }}>Réservations</th>
                <th style={{ textAlign: 'right' }}>Annulations</th>
                <th style={{ textAlign: 'right' }}>Lead Moyen (j)</th>
                <th style={{ textAlign: 'right' }}>Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => {
                const rate = (s.cancellation_rate * 100).toFixed(1);
                const isHigh = s.cancellation_rate > 0.4;
                const isMid  = s.cancellation_rate > 0.25;
                const rateColor = isHigh ? '#f43f5e' : isMid ? '#f59e0b' : '#10b981';
                return (
                  <tr key={s.segment_clean}>
                    <td>
                      <span className={`badge ${isHigh ? 'badge-danger' : isMid ? 'badge-warning' : 'badge-success'}`}>
                        {s.segment_clean}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {s.total_bookings.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: isHigh ? '#f43f5e' : 'var(--text-secondary)', fontWeight: isHigh ? 700 : 400 }}>
                      {s.cancellations.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {s.avg_lead_time != null ? Math.round(s.avg_lead_time) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <div style={{ width: 64, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, s.cancellation_rate * 100)}%`,
                            height: '100%', background: rateColor, borderRadius: 99
                          }} />
                        </div>
                        <span style={{ color: rateColor, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                          {rate}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
