/**
 * socket-client.js
 * CarIQ WebSocket client — real-time notifications
 * 
 * Connects to the Express server via Socket.io.
 * Listens for events: new_lead, sale_closed, new_customer
 * Updates the UI without page refresh.
 */

// Load socket.io client from CDN
(function loadSocketIO() {
  const script   = document.createElement('script');
  script.src     = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
  script.onload  = initSocket;
  script.onerror = () => console.warn('⚠️  Socket.io CDN failed — real-time disabled');
  document.head.appendChild(script);
})();

let socket = null;

function initSocket() {
  const serverUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : window.location.origin;

  try {
    socket = io(serverUrl, {
      transports:        ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
      showNotification('🔌 Real-time updates active', 'info', 2000);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️  WebSocket error:', err.message);
    });

    // ── Event Handlers ────────────────────────────────────────
    socket.on('new_lead', (data) => {
      console.log('📋 New lead created:', data);
      showNotification(
        `📋 New Lead #${data.lead_id} created — ${data.status}`,
        'success'
      );
      incrementCounter('total-leads');
      addToLiveFeed('lead', data);
    });

    socket.on('sale_closed', (data) => {
      console.log('💳 Sale closed:', data);
      const emiText = data.emi_amount
        ? ` | EMI: ₹${Number(data.emi_amount).toLocaleString('en-IN')}`
        : '';
      showNotification(
        `💳 Sale closed — ${data.payment_mode}${emiText}`,
        'success'
      );
      addToLiveFeed('transaction', data);
    });

    socket.on('new_customer', (data) => {
      console.log('👤 New customer:', data);
      showNotification(
        `👤 New customer registered — ${data.city}, ${data.state}`,
        'info'
      );
      incrementCounter('total-customers');
      addToLiveFeed('customer', data);
    });

  } catch (err) {
    console.warn('⚠️  WebSocket init failed:', err.message);
  }
}

// ── UI Helpers ────────────────────────────────────────────────
function showNotification(message, type = 'info', duration = 4000) {
  // Remove existing notification
  const existing = document.getElementById('ws-notification');
  if (existing) existing.remove();

  const colors = {
    success: { bg: 'rgba(46,204,113,0.15)',  border: '#2ecc71', text: '#2ecc71' },
    info:    { bg: 'rgba(52,152,219,0.15)',  border: '#3498db', text: '#3498db' },
    warning: { bg: 'rgba(243,156,18,0.15)',  border: '#f39c12', text: '#f39c12' },
    error:   { bg: 'rgba(231,76,60,0.15)',   border: '#e74c3c', text: '#e74c3c' },
  };
  const c = colors[type] || colors.info;

  const notif = document.createElement('div');
  notif.id    = 'ws-notification';
  notif.style.cssText = `
    position: fixed;
    top: 70px;
    right: 1rem;
    background: ${c.bg};
    border: 1px solid ${c.border};
    color: ${c.text};
    padding: 0.75rem 1.2rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    z-index: 9999;
    max-width: 380px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease;
    cursor: pointer;
  `;
  notif.textContent = message;
  notif.onclick     = () => notif.remove();

  // Add slide-in animation
  if (!document.getElementById('ws-notification-style')) {
    const style = document.createElement('style');
    style.id    = 'ws-notification-style';
    style.textContent = `
      @keyframes slideInRight {
        from { opacity:0; transform: translateX(100px); }
        to   { opacity:1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notif);
  if (duration > 0) setTimeout(() => notif?.remove(), duration);
}

function incrementCounter(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  el.textContent = current + 1;

  // Flash animation
  el.style.transition = 'color 0.3s ease';
  el.style.color      = '#2ecc71';
  setTimeout(() => {
    el.style.color = '';
  }, 1000);
}

function addToLiveFeed(type, data) {
  const feed = document.getElementById('live-feed');
  if (!feed) return;

  const icons = { lead: '📋', transaction: '💳', customer: '👤' };
  const time  = new Date().toLocaleTimeString('en-IN');

  const item = document.createElement('div');
  item.style.cssText = `
    padding: 0.5rem 0.8rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
    color: var(--text);
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: fadeSlideUp 0.3s ease;
  `;
  item.innerHTML = `
    <span>${icons[type]} ${getEventDescription(type, data)}</span>
    <span style="color:var(--muted);font-size:0.75rem;">${time}</span>
  `;

  // Add to top of feed
  feed.insertBefore(item, feed.firstChild);

  // Keep only last 10 items
  while (feed.children.length > 10) {
    feed.removeChild(feed.lastChild);
  }
}

function getEventDescription(type, data) {
  switch (type) {
    case 'lead':
      return `Lead #${data.lead_id} — ${data.status} (${data.dealer_name || 'Walk-in'})`;
    case 'transaction':
      return `Sale closed — ${data.payment_mode}${data.emi_amount ? ` | EMI: ₹${Number(data.emi_amount).toLocaleString('en-IN')}` : ''}`;
    case 'customer':
      return `Customer registered — ${data.city}, ${data.state}`;
    default:
      return JSON.stringify(data);
  }
}

// ── Export for manual use ────────────────────────────────────
window.CarIQSocket = {
  getSocket:        () => socket,
  showNotification,
  incrementCounter,
  addToLiveFeed,
};