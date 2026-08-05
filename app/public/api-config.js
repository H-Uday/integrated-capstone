// Dynamic API URL for Localhost vs. Render Deployment
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;
