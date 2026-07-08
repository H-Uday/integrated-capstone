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

function formatCurrency(value, currency = '₹') {
  return `${currency}${Number(value).toLocaleString('en-IN')}`;
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
    annual_income_local: document.getElementById("annual_income").value,
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
        `✅ Customer registered successfully! ID: ${data.customer_id}`,
        'success'
      );
      document.getElementById('customer-form').reset();
    } else {
      const msg = data.errors ? data.errors.join(' | ') : data.error;
      showAlert('form-alert', `❌ ${msg}`, 'error');
    }
  } catch (err) {
    showAlert('form-alert', '❌ Server unreachable. Is the app running?', 'error');
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
        `✅ Lead created successfully! Lead ID: ${data.lead_id}`,
        'success'
      );
      document.getElementById('lead-form').reset();
      loadVehicles();
    } else {
      const msg = data.errors ? data.errors.join(' | ') : data.error;
      showAlert('lead-alert', `❌ ${msg}`, 'error');
    }
  } catch (err) {
    showAlert('lead-alert', '❌ Server unreachable. Is the app running?', 'error');
  } finally {
    setLoading('lead-btn', false);
  }
}

// ── Load Vehicles into dropdown ───────────────────────────────
async function loadVehicles() {
  const select = document.getElementById('vehicle_id');
  if (!select) return;

  try {
    const res     = await fetch(`${API}/vehicles`);
    const data    = await res.json();
    select.innerHTML = '<option value="">Select vehicle...</option>';
    data.data.forEach(v => {
      const opt   = document.createElement('option');
      opt.value   = v.vehicle_id;
      opt.textContent = `${v.make} ${v.model} ${v.variant || ''} — ₹${Number(v.price_local).toLocaleString('en-IN')} (${v.segment})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load vehicles:', err);
  }
}

// ── Dashboard Metrics ─────────────────────────────────────────
async function loadDashboard() {
  try {
    // Fetch vehicles count
    const vRes  = await fetch(`${API}/vehicles`);
    const vData = await vRes.json();

    if (vData.success) {
      document.getElementById('total-vehicles').textContent = vData.count;
    }

    // Recent leads — fetch for customer 1 as demo
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
          <td>₹${Number(lead.price_inr || lead.price_local).toLocaleString('en-IN')}</td>
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
  const customerForm = document.getElementById('customer-form');
  if (customerForm) customerForm.addEventListener('submit', submitCustomer);

  const leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', submitLead);
    loadVehicles();
    document.getElementById('enquiry_date').value =
      new Date().toISOString().split('T')[0];
  }

  if (document.getElementById('total-vehicles')) loadDashboard();
});