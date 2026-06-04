const API_BASE = 'http://localhost:5000/api';

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchReservations(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/reservations?${query}`);
  if (!res.ok) throw new Error('Failed to fetch reservations');
  return res.json();
}

export async function createReservation(data) {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create reservation');
  return res.json();
}

export async function updateReservation(id, data) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update reservation');
  return res.json();
}

export async function deleteReservation(id) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete reservation');
  return res.json();
}

export async function predictCancellation(data) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to predict');
  return res.json();
}
