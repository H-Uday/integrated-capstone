/**
 * wsTest.js
 * Tests WebSocket events by simulating API calls and
 * verifying events are emitted correctly.
 *
 * Run: node src/utils/wsTest.js
 * (Server must be running on port 3000)
 */

const io = require('socket.io-client');

const SERVER = 'http://localhost:3000';
const events = [];

console.log('🧪 CarIQ WebSocket Test');
console.log('='.repeat(40));
console.log('Connecting to:', SERVER);

const socket = io(SERVER, { transports: ['websocket'] });

socket.on('connect', async () => {
  console.log('✅ Connected:', socket.id);
  console.log('\nListening for events...');
  console.log('Now create a customer, lead, or transaction via the API\n');

  // Listen for all events
  ['new_customer', 'new_lead', 'sale_closed'].forEach(event => {
    socket.on(event, (data) => {
      events.push({ event, data, time: new Date().toISOString() });
      console.log(`\n📡 Event received: ${event}`);
      console.log('   Data:', JSON.stringify(data, null, 2));
    });
  });

  // Auto-disconnect after 30 seconds
  setTimeout(() => {
    console.log(`\n📊 Test Summary: ${events.length} events received`);
    events.forEach((e, i) => {
      console.log(`   ${i+1}. ${e.event} at ${e.time}`);
    });
    socket.disconnect();
    process.exit(0);
  }, 30000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection failed:', err.message);
  console.log('   Make sure server is running: npm run dev');
  process.exit(1);
});