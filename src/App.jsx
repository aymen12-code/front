import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Forecasting from './pages/Forecasting';
import Predictor from './pages/Predictor';

const PAGE_CONFIG = {
  dashboard:    { title: 'Analytics Dashboard',           sub: 'Overview of reservation performance and revenue trends' },
  reservations: { title: 'Reservations',                  sub: 'Browse, search, filter and manage all reservation records' },
  forecasting:  { title: 'Forecasting & Cancellations',   sub: 'Monthly cancellation analysis, critical periods and segment performance' },
  predictor:    { title: 'Cancellation Risk Predictor',   sub: 'Estimate cancellation probability for new bookings using historical patterns' },
};

function Topbar({ page }) {
  const cfg = PAGE_CONFIG[page];
  const now = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{cfg.title}</h1>
        <p>{cfg.sub}</p>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{now}</span>
        <span className="badge badge-success">● Live</span>
      </div>
    </header>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app-layout">
      <Sidebar active={page} onChange={setPage} />
      <div className="main-content">
        <Topbar page={page} />
        <main className="page-body" id={`page-${page}`}>
          {page === 'dashboard'    && <Dashboard />}
          {page === 'reservations' && <Reservations />}
          {page === 'forecasting'  && <Forecasting />}
          {page === 'predictor'    && <Predictor />}
        </main>
      </div>
    </div>
  );
}
