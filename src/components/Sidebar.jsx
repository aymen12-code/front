import { LayoutDashboard, CalendarCheck2, BrainCircuit, TrendingDown } from 'lucide-react';

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'reservations',  label: 'Reservations',  icon: CalendarCheck2 },
  { id: 'forecasting',   label: 'Forecasting',   icon: TrendingDown },
  { id: 'predictor',     label: 'Risk Predictor', icon: BrainCircuit },
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🏨 Hotel VALLERIA MEDINQ</h2>
        <p>Analytics Suite</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot" />
          API Live — Port 5000
        </div>
      </div>
    </aside>
  );
}
