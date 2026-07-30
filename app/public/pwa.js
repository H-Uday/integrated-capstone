/**
 * pwa.js
 * PWA registration and install prompt handler.
 * Include on every page: <script src="pwa.js"></script>
 */

// ── Service Worker Registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' &&
              navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });

    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });

  // Handle controller change (new SW activated)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// ── Install Prompt ────────────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Only show if not already installed
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    setTimeout(showInstallBanner, 3000);
  }
});

function showInstallBanner() {
  if (!deferredPrompt) return;
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id    = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: #16213e;
    border: 1px solid #00d9d9;
    border-radius: 10px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 9999;
    max-width: 90vw;
    animation: slideUp 0.4s ease;
  `;

  banner.innerHTML = `
    <div style="font-size:2rem;">🚗</div>
    <div>
      <div style="color:#ffffff;font-weight:700;font-size:0.95rem;">
        Install CarIQ App
      </div>
      <div style="color:#a0a0b0;font-size:0.8rem;margin-top:0.2rem;">
        Add to home screen for offline access
      </div>
    </div>
    <button id="pwa-install-btn"
            style="background:#00d9d9;color:#1a1a2e;border:none;
                   border-radius:6px;padding:0.5rem 1rem;
                   font-weight:700;cursor:pointer;white-space:nowrap;">
      Install
    </button>
    <button id="pwa-dismiss-btn"
            style="background:transparent;color:#a0a0b0;border:none;
                   cursor:pointer;font-size:1.2rem;padding:0.2rem;">
      ✕
    </button>
  `;

  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    deferredPrompt = null;
    banner.remove();
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    // Don't show again for 24 hours
    localStorage.setItem('pwa-dismissed', Date.now());
  });
}

// ── Update Banner ─────────────────────────────────────────────
function showUpdateBanner() {
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id    = 'pwa-update-banner';
  banner.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: #16213e;
    border: 1px solid #f39c12;
    border-radius: 8px;
    padding: 0.8rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 9999;
    font-size: 0.88rem;
  `;

  banner.innerHTML = `
    <span style="color:#f39c12;">🔄 CarIQ update available</span>
    <button onclick="window.location.reload()"
            style="background:#f39c12;color:#1a1a2e;border:none;
                   border-radius:4px;padding:0.3rem 0.8rem;
                   font-weight:700;cursor:pointer;">
      Refresh
    </button>
    <button onclick="this.parentElement.remove()"
            style="background:transparent;color:#a0a0b0;
                   border:none;cursor:pointer;">
      ✕
    </button>
  `;

  document.body.appendChild(banner);
}

// ── Offline Detection ─────────────────────────────────────────
function updateOnlineStatus() {
  const indicator = document.getElementById('online-status');
  if (!indicator) return;

  if (navigator.onLine) {
    indicator.textContent = '🟢 Online';
    indicator.style.color = '#2ecc71';
  } else {
    indicator.textContent = '🔴 Offline';
    indicator.style.color = '#e74c3c';
  }
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', () => {
  updateOnlineStatus();
  if (window.CarIQSocket) {
    window.CarIQSocket.showNotification(
      '📡 You are offline — cached data will be shown',
      'warning', 5000
    );
  }
});

// Initial status check
document.addEventListener('DOMContentLoaded', updateOnlineStatus);