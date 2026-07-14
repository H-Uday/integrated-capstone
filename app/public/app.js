// ── Auth Helpers ──────────────────────────────────────────────
function isLoggedIn() {
  return !!localStorage.getItem('cariq_token');
}

function getUser() {
  const u = localStorage.getItem('cariq_user');
  return u ? JSON.parse(u) : null;
}

function logout() {
  localStorage.removeItem('cariq_token');
  localStorage.removeItem('cariq_user');
  window.location.href = 'login.html';
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// CarIQ Frontend — API Client
const API = 'http://localhost:3000/api';

// ── Utility ──────────────────────────────────────────────────
function showAlert(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent  = message;
  el.className    = `alert ${type} show`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Submitting...' : btn.dataset.label;
}

function badgeClass(status) {
  const map = {
    'Converted':   'badge-converted',
    'New':         'badge-new',
    'Rejected':    'badge-rejected',
    'In-Progress': 'badge-inprogress',
    'On-Hold':     'badge-onhold'
  };
  return map[status] || 'badge-new';
}

// ── Customer Form ─────────────────────────────────────────────
async function submitCustomer(e) {
  e.preventDefault();
  setLoading('submit-btn', true);

  const payload = {
    full_name:       document.getElementById('full_name').value,
    email:           document.getElementById('email').value,
    phone:           document.getElementById('phone').value,
    city:            document.getElementById('city').value,
    state:           document.getElementById('state').value,
    annual_income_local: document.getElementById('annual_income').value,
    credit_score:    document.getElementById('credit_score').value,
    employment_type: document.getElementById('employment_type').value
  };

  try {
    const res  = await fetch(`${API}/customers`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAlert('form-alert',
        `Customer registered successfully! ID: ${data.customer_id}`,
        'success'
      );
      document.getElementById('customer-form').reset();
    } else {
      const msg = data.errors ? data.errors.join(' | ') : data.error;
      showAlert('form-alert', `${msg}`, 'error');
    }
  } catch (err) {
    showAlert('form-alert', 'Server unreachable. Is the app running?', 'error');
  } finally {
    setLoading('submit-btn', false);
  }
}

// ── Lead Form ─────────────────────────────────────────────────
async function submitLead(e) {
  e.preventDefault();
  setLoading('lead-btn', true);

  const payload = {
    customer_id:  document.getElementById('customer_id').value,
    vehicle_id:   document.getElementById('vehicle_id').value,
    enquiry_date: document.getElementById('enquiry_date').value,
    status:       'New',
    dealer_name:  document.getElementById('dealer_name').value,
    state:        document.getElementById('lead_state').value,
    notes:        document.getElementById('notes').value
  };

  try {
    const res  = await fetch(`${API}/leads`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAlert('lead-alert',
        `Lead created successfully! Lead ID: ${data.lead_id}`,
        'success'
      );
      document.getElementById('lead-form').reset();
      loadVehicles();
    } else {
      const msg = data.errors ? data.errors.join(' | ') : data.error;
      showAlert('lead-alert', `${msg}`, 'error');
    }
  } catch (err) {
    showAlert('lead-alert', 'Server unreachable. Is the app running?', 'error');
  } finally {
    setLoading('lead-btn', false);
  }
}

// ── Real Car Images (Smart Wikipedia Multi-Layer Fallback Search) ────
async function fetchCarImage(make, model, segment, year) {
  const container = document.getElementById('car-image-container');
  const carImg    = document.getElementById('car-image');
  const carLabel  = document.getElementById('car-label');
  const fallback  = document.getElementById('car-fallback');
  const skeleton  = document.getElementById('car-skeleton');
  const carDef    = document.getElementById('car-default');
  if (!container) return;

  if (carDef)    carDef.style.display    = 'none';
  skeleton.style.display                 = 'block';
  carImg.style.display                   = 'none';
  if (fallback)  fallback.style.display  = 'none';
  carLabel.style.display                 = 'block';
  carLabel.textContent                   = `${make} ${model} ${year || ''}`;

  // Generate fallback options array to ensure we find a real image no matter what
  const searchOptions = [
    `${make}_${model}`,                     // 1. Exact Match: Toyota_Fortuner
    `${make} ${model}`,                     // 2. Space Match: Toyota Fortuner
    model,                                  // 3. Model only: Fortuner
    `${make}`                               // 4. Brand Base line: Toyota
  ];

  for (const option of searchOptions) {
    try {
      const sanitizedTitle = encodeURIComponent(option.trim().replace(/\s+/g, '_'));
      const wikiAPI = `https://en.wikipedia.org/api/rest_v1/page/summary/${sanitizedTitle}`;
      const res = await fetch(wikiAPI);
      
      if (!res.ok) continue; // Skip to next option if Wikipedia pages 404s
      const data = await res.json();
      
      const targetImage = (data.originalimage && data.originalimage.source) || (data.thumbnail && data.thumbnail.source);
      
      if (targetImage) {
        carImg.src = targetImage;
        carImg.style.display = 'block';
        skeleton.style.display = 'none';
        return; // Success! Exit out of the loop completely
      }
    } catch (e) {
      console.warn(`Query iteration failed for option: ${option}`, e);
    }
  }

  // If all automated lookup layers fail completely, display fallback icon safely
  skeleton.style.display = 'none';
  if (fallback) {
    fallback.style.display = 'block';
    fallback.textContent = '🚗';
  }
}

// ── Load Vehicles into dropdown ───────────────────────────────
async function loadVehicles() {
  const select = document.getElementById('vehicle_id');
  if (!select) return;

  try {
    const res  = await fetch(`${API}/vehicles`);
    const data = await res.json();
    select.innerHTML = '<option value="">Select vehicle...</option>';

    // Store vehicle data for image lookup
    window._vehicles = data.data;

    data.data.forEach(v => {
      const opt       = document.createElement('option');
      opt.value       = v.vehicle_id;
      opt.textContent = `${v.make} ${v.model} ${v.variant || ''} ${v.year} — ₹${Number(v.price_local).toLocaleString('en-IN')} (${v.segment})`;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error('Failed to load vehicles:', err);
  }

  // Attach change listener INSIDE loadVehicles after dropdown is populated
  select.addEventListener('change', () => {
    if (!select.value) return;

    // Find vehicle from stored data
    const vehicle = window._vehicles &&
      window._vehicles.find(v => String(v.vehicle_id) === String(select.value));

    if (vehicle) {
      fetchCarImage(vehicle.make, vehicle.model, vehicle.segment, vehicle.year);
    }
  });
}

// ── Dashboard Metrics ─────────────────────────────────────────
async function loadDashboard() {
  try {
    // Vehicles count
    const vRes  = await fetch(`${API}/vehicles`);
    const vData = await vRes.json();
    if (vData.success) {
      document.getElementById('total-vehicles').textContent = vData.count;
    }

    // Customers count
    const cRes  = await fetch(`${API}/customers/count`);
    const cData = await cRes.json();
    if (cData.success) {
      document.getElementById('total-customers').textContent = cData.count;
    }

    // Leads count
    const lCountRes  = await fetch(`${API}/leads/count`);
    const lCountData = await lCountRes.json();
    if (lCountData.success) {
      document.getElementById('total-leads').textContent = lCountData.count;
    }

    // Recent leads for customer 1
    const lRes  = await fetch(`${API}/leads/1`);
    const lData = await lRes.json();
    if (lData.success && lData.data.length > 0) {
      const tbody = document.getElementById('leads-tbody');
      tbody.innerHTML = '';
      lData.data.slice(0, 5).forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${lead.lead_id}</td>
          <td>${lead.make} ${lead.model}</td>
          <td>${lead.segment}</td>
          <td>₹${Number(lead.price_local || 0).toLocaleString('en-IN')}</td>
          <td><span class="badge ${badgeClass(lead.status)}">${lead.status}</span></td>
          <td>${lead.enquiry_date}</td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ── Event Binding ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Auth gate — protect pages ──
  const page = window.location.pathname.split('/').pop();
  const protectedPages = [
    'customers.html','leads.html',
    'transactions.html','dashboard.html'
  ];
  if (protectedPages.includes(page) && !isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // ── Login page — skip if already logged in ──
  if (page === 'login.html' && isLoggedIn()) {
    window.location.href = 'home.html';
    return;
  }



  // ── Customer form ──
  const customerForm = document.getElementById('customer-form');
  if (customerForm) customerForm.addEventListener('submit', submitCustomer);

  // ── Lead form ──
  const leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', submitLead);
    loadVehicles();
    document.getElementById('enquiry_date').value =
      new Date().toISOString().split('T')[0];
  }

  // ── Dashboard ──
  if (document.getElementById('total-vehicles')) loadDashboard();

  // ── Transactions page ──
  const txnForm = document.getElementById('transaction-form');
  if (txnForm) {
    loadTxnVehicles();
    document.getElementById('t_transaction_date').value =
      new Date().toISOString().split('T')[0];
  }
});