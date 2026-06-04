import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchReservations, createReservation, updateReservation, deleteReservation } from '../api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

const EMPTY_FORM = {
  customer: '', mainGuest: '', roomName: '', roomType: 'Standard Room',
  reservationStatus: 'CHECKEDOUT', checkin: '', checkout: '', created: '',
  nights: '1', price: '', adult: '2', child: '0',
  segment: 'WalkIn', market: 'DIRECT', currency: 'MAD',
  bookingNumber: '',
};

function ReservationModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initial ? '✏️ Edit Reservation' : '➕ New Reservation'}</h2>
        {err && <div className="error-box" style={{ marginBottom: 14 }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name</label>
              <input className="form-input" value={form.customer} onChange={e => set('customer', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Main Guest</label>
              <input className="form-input" value={form.mainGuest} onChange={e => set('mainGuest', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-input" value={form.reservationStatus} onChange={e => set('reservationStatus', e.target.value)}>
                <option value="CHECKEDOUT">CHECKEDOUT</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NOSHOW">NOSHOW</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <div className="form-group">
              <label>Room Name</label>
              <input className="form-input" value={form.roomName} onChange={e => set('roomName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select className="form-input" value={form.roomType} onChange={e => set('roomType', e.target.value)}>
                <option>Standard Room</option>
                <option>Family Room</option>
                <option>Suite</option>
                <option>Deluxe Room</option>
              </select>
            </div>
            <div className="form-group">
              <label>Segment</label>
              <select className="form-input" value={form.segment} onChange={e => set('segment', e.target.value)}>
                {['WalkIn','OTA','B2B','VCR','AVM','CRS','WEB','TO','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Check-in Date</label>
              <input type="date" className="form-input" value={form.checkin} onChange={e => set('checkin', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Check-out Date</label>
              <input type="date" className="form-input" value={form.checkout} onChange={e => set('checkout', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Nights</label>
              <input type="number" min="1" max="60" className="form-input" value={form.nights} onChange={e => set('nights', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Price (MAD)</label>
              <input type="number" min="0" className="form-input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 1576" />
            </div>
            <div className="form-group">
              <label>Adults</label>
              <input type="number" min="1" max="10" className="form-input" value={form.adult} onChange={e => set('adult', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Children</label>
              <input type="number" min="0" max="10" className="form-input" value={form.child} onChange={e => set('child', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Market</label>
              <input className="form-input" value={form.market} onChange={e => set('market', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Booking Number</label>
              <input className="form-input" value={form.bookingNumber} onChange={e => set('bookingNumber', e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-reservation-btn">
              {saving ? 'Saving…' : 'Save Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function statusBadge(status, is_cancelled) {
  if (status === 'CHECKEDOUT') return <span className="badge badge-success">✓ Checked Out</span>;
  if (status === 'CANCELLED') return <span className="badge badge-danger">✕ Cancelled</span>;
  if (status === 'NOSHOW') return <span className="badge badge-warning">⚠ No-Show</span>;
  if (status === 'EXPIRED') return <span className="badge badge-warning">⏱ Expired</span>;
  return <span className="badge badge-info">{status}</span>;
}

export default function Reservations() {
  const [data, setData] = useState({ reservations: [], pagination: { total: 0, page: 1, pages: 1, limit: 15 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [segment, setSegment] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | reservation object

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReservations({ page, limit: 15, search, status, category, segment });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, category, segment]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, status, category, segment]);

  async function handleSave(form) {
    if (modal && modal.bookingId) {
      await updateReservation(modal.bookingId, form);
    } else {
      await createReservation(form);
    }
    load();
  }

  async function handleDelete(bookingId) {
    if (!window.confirm(`Delete reservation ${bookingId}?`)) return;
    try {
      await deleteReservation(bookingId);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const { reservations, pagination } = data;
  const pageNumbers = [];
  for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.pages, pagination.page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      {error && <div className="error-box">⚠️ {error}</div>}

      <div className="table-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              id="reservation-search"
              className="search-input"
              placeholder="Search by guest, booking ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select id="filter-status" className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="CHECKEDOUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select id="filter-category" className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Rooms</option>
            <option value="Standard">Standard</option>
            <option value="Family">Family</option>
            <option value="Suite">Suite</option>
            <option value="Autre">Autre</option>
          </select>
          <select id="filter-segment" className="filter-select" value={segment} onChange={e => setSegment(e.target.value)}>
            <option value="">All Segments</option>
            {['WalkIn','OTA','B2B','VCR','AVM','CRS','WEB','TO','Other'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button id="refresh-btn" className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
            <RefreshCw size={13} />
          </button>
          <button id="add-reservation-btn" className="btn btn-primary btn-sm" onClick={() => setModal('create')}>
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-screen" style={{ height: 200 }}>
              <div className="spinner" /><p>Loading…</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Room</th>
                  <th>Segment</th>
                  <th>Check-in</th>
                  <th>Nights</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reservations found</td></tr>
                ) : reservations.map((r, i) => (
                  <tr key={r.bookingId || i}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.bookingId}</td>
                    <td>{r.customer || '—'}</td>
                    <td>
                      <div>{r.roomName || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.roomCategory}</div>
                    </td>
                    <td><span className="badge badge-info">{r.segment}</span></td>
                    <td>{fmt(r.checkin)}</td>
                    <td>{r.nights}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {r.price ? r.price.toLocaleString() : '—'} <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>MAD</small>
                    </td>
                    <td>{statusBadge(r.reservationStatus, r.is_cancelled)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => setModal(r)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(r.bookingId)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span>{pagination.total.toLocaleString()} records · Page {pagination.page} of {pagination.pages}</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={13} />
            </button>
            {pageNumbers.map(n => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <ReservationModal
          initial={modal === 'create' ? null : { ...modal, checkin: modal.checkin ? modal.checkin.slice(0,10) : '', checkout: modal.checkout ? modal.checkout.slice(0,10) : '', created: modal.created ? modal.created.slice(0,10) : '' }}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
