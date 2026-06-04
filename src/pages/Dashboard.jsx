import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fetchKPIs, fetchAnalytics } from '../api';

const COLORS = ['#4f8ef7', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

function fmt(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtMAD(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M MAD`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K MAD`;
  return `${fmt(n)} MAD`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#131d35', border: '1px solid rgba(99,157,255,0.2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <p style={{ color: '#8a9cc4', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value < 1 && p.value > 0
            ? `${(p.value * 100).toFixed(1)}%`
            : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#131d35', border: '1px solid rgba(99,157,255,0.2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <p style={{ color: d.payload.fill, fontWeight: 600 }}>{d.name}</p>
      <p style={{ color: '#8a9cc4' }}>Bookings: <b style={{ color: '#e8edf8' }}>{fmt(d.value)}</b></p>
      <p style={{ color: '#8a9cc4' }}>Cancellations: <b style={{ color: '#f43f5e' }}>{fmt(d.payload.cancellations)}</b></p>
    </div>
  );
};

const kpiDefs = [
  {
    key: 'total_bookings',
    label: 'Total Bookings',
    icon: '📋',
    iconBg: 'rgba(79,142,247,0.12)',
    accent: 'linear-gradient(90deg,#4f8ef7,#8b5cf6)',
    format: (v) => fmt(v),
    sub: 'Final status records',
  },
  {
    key: 'total_revenue',
    label: 'Total Revenue',
    icon: '💰',
    iconBg: 'rgba(16,185,129,0.12)',
    accent: 'linear-gradient(90deg,#10b981,#06b6d4)',
    format: fmtMAD,
    sub: 'Checked-out bookings only',
  },
  {
    key: 'cancellation_rate',
    label: 'Cancellation Rate',
    icon: '📉',
    iconBg: 'rgba(244,63,94,0.12)',
    accent: 'linear-gradient(90deg,#f43f5e,#f59e0b)',
    format: (v) => `${(v * 100).toFixed(1)}%`,
    sub: (d) => `${fmt(d.total_cancellations)} cancelled`,
  },
  {
    key: 'average_adr',
    label: 'Avg. Night Price',
    icon: '🏷️',
    iconBg: 'rgba(245,158,11,0.12)',
    accent: 'linear-gradient(90deg,#f59e0b,#f43f5e)',
    format: (v) => `${fmt(v, 0)} MAD`,
    sub: 'Average daily rate',
  },
  {
    key: 'average_lead_time',
    label: 'Avg. Lead Time',
    icon: '📅',
    iconBg: 'rgba(139,92,246,0.12)',
    accent: 'linear-gradient(90deg,#8b5cf6,#4f8ef7)',
    format: (v) => `${fmt(v, 1)} days`,
    sub: 'Booking to check-in gap',
  },
  {
    key: 'average_nights',
    label: 'Avg. Stay',
    icon: '🌙',
    iconBg: 'rgba(6,182,212,0.12)',
    accent: 'linear-gradient(90deg,#06b6d4,#10b981)',
    format: (v) => `${fmt(v, 1)} nights`,
    sub: 'Mean length of stay',
  },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, a] = await Promise.all([fetchKPIs(), fetchAnalytics()]);
      setKpis(k);
      setAnalytics(a);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading analytics…</p>
    </div>
  );

  if (error) return <div className="error-box">⚠️ {error} — Make sure the backend is running on port 5000.</div>;

  const monthly = analytics?.monthly_trends ?? [];
  const rooms = analytics?.room_category ?? [];
  const segments = analytics?.segment ?? [];
  const leadTime = analytics?.lead_time ?? [];

  const pieData = rooms.map(r => ({
    name: r.roomCategory,
    value: r.total_bookings,
    cancellations: r.cancellations,
    fill: COLORS[rooms.indexOf(r) % COLORS.length]
  }));

  const leadOrdered = ['0-7 days', '8-30 days', '31-90 days', '90+ days']
    .map(b => leadTime.find(l => l.lead_time_bucket === b) ?? { lead_time_bucket: b, total_bookings: 0, cancellations: 0, cancellation_rate: 0 });

  return (
    <div>
      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiDefs.map(def => (
          <div key={def.key} className="kpi-card" style={{ '--kpi-accent': def.accent }}>
            <div className="kpi-icon" style={{ background: def.iconBg }}>
              {def.icon}
            </div>
            <div className="kpi-label">{def.label}</div>
            <div className="kpi-value">{def.format(kpis[def.key])}</div>
            <div className="kpi-sub">
              {typeof def.sub === 'function' ? def.sub(kpis) : def.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue + Bookings */}
      <div style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <h3>Monthly Bookings &amp; Revenue Trend</h3>
          <p>Checked-out revenue and total booking volume over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,157,255,0.07)" />
              <XAxis dataKey="month_year" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="total_bookings" stroke="#4f8ef7" fill="url(#gradBookings)" name="Bookings" strokeWidth={2} dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradRevenue)" name="Revenue (MAD)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        {/* Segment Performance */}
        <div className="chart-card">
          <h3>Bookings by Segment</h3>
          <p>Volume and cancellation count per booking source</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={segments} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,157,255,0.07)" />
              <XAxis dataKey="segment_clean" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#4a5a7a', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total_bookings" name="Bookings" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancellations" name="Cancellations" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Room Category Pie */}
        <div className="chart-card">
          <h3>Bookings by Room Category</h3>
          <p>Distribution across room types</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead Time Analysis */}
      <div className="chart-card">
        <h3>Cancellation Rate by Lead Time</h3>
        <p>How far in advance bookings were made vs. cancellation likelihood</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={leadOrdered} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,157,255,0.07)" />
            <XAxis dataKey="lead_time_bucket" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#4a5a7a', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#4a5a7a', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="total_bookings" name="Total Bookings" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="cancellation_rate" name="Cancel Rate" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
