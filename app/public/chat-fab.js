/**
 * chat-fab.js
 * Floating Action Button — shows AI chat button on every CarIQ page.
 * Include at bottom of every page: <script src="chat-fab.js"></script>
 */

document.addEventListener('DOMContentLoaded', () => {
  // Don't show on chatbot page itself
  if (window.location.pathname.includes('chatbot')) return;

  const fab = document.createElement('a');
  fab.href  = 'chatbot.html';
  fab.className = 'chat-fab';
  fab.title     = 'Ask CarIQ AI';
  fab.innerHTML = `
    🤖
    <span class="fab-badge">AI</span>
  `;

  // Add pulse ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid rgba(0,217,217,0.5);
    z-index: 998;
    animation: fabRing 2s ease infinite;
    pointer-events: none;
  `;

  const style = document.createElement('style');
  style.textContent = `
    .chat-fab {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d9d9, #7b2fff);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      box-shadow: 0 8px 32px rgba(0,217,217,0.5);
      z-index: 999;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .chat-fab:hover { transform: scale(1.15) rotate(10deg); }
    .fab-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: #ff6b35;
      border-radius: 50%;
      font-size: 0.6rem;
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes fabRing {
      0%   { transform: scale(1);   opacity: 0.8; }
      50%  { transform: scale(1.4); opacity: 0; }
      100% { transform: scale(1);   opacity: 0; }
    }
    .fab-tooltip {
      position: fixed;
      bottom: 5rem;
      right: 1.2rem;
      background: rgba(22,33,62,0.95);
      border: 1px solid rgba(0,217,217,0.3);
      color: #eaeaea;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-size: 0.8rem;
      white-space: nowrap;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(ring);
  document.body.appendChild(fab);

  // Tooltip on hover
  const tooltip = document.createElement('div');
  tooltip.className = 'fab-tooltip';
  tooltip.textContent = '🤖 Ask CarIQ AI anything!';
  document.body.appendChild(tooltip);

  fab.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
  fab.addEventListener('mouseleave', () => tooltip.style.opacity = '0');

  // Show welcome tip after 3 seconds
  setTimeout(() => {
    tooltip.style.opacity = '1';
    setTimeout(() => tooltip.style.opacity = '0', 3000);
  }, 3000);
});