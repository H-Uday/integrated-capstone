/**
 * chatbotController.js
 * CarIQ AI Chatbot powered by Groq Cloud API (Llama 3.3 70B)
 *
 * Answers ANY car, automotive, or CarIQ question naturally.
 */

require('dotenv').config();
const Groq     = require('groq-sdk');
const { db }   = require('../config/database');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── 1. Fetch Real-time DB Snapshot ────────────────────────────
function getLiveContext() {
  try {
    const customers    = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
    const vehicles     = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
    const leads        = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
    const transactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;

    const topVehicles = db.prepare(`
      SELECT make, model, segment, price_local, currency_code, fuel_type
      FROM vehicles ORDER BY price_local ASC LIMIT 10
    `).all();

    return {
      customers, vehicles, leads, transactions,
      top_vehicles: topVehicles.map(v =>
        `${v.make} ${v.model} (${v.segment}, ${v.fuel_type}, ₹${Number(v.price_local).toLocaleString('en-IN')} ${v.currency_code})`
      ).join('\n  '),
    };
  } catch (err) {
    return null;
  }
}

// ── 2. System Instructions ────────────────────────────────────
function buildSystemInstruction(ctx) {
  return `You are CarIQ Assistant — an expert automotive advisor and general car intelligence consultant.

### Your Role:
1. You can answer ANY question about cars, automotive engineering, market trends, electric vehicles, maintenance, loan financing, or general car trivia.
2. If the user asks about CarIQ platform metrics or prices in our database, refer to the Database Snapshot below.
3. If the user asks general questions about cars (e.g., "How does a turbocharger work?", "Swift Dzire features", "Bugatti top speed"), answer using your full automotive knowledge.
4. NEVER issue safety refusals for harmless vehicle pricing or automotive specs.

### CarIQ Database Snapshot:
- Total Tracked Vehicles: ${ctx ? ctx.vehicles : 26}
- Total Customers: ${ctx ? ctx.customers : 173}
- Sample Database Catalog:
  ${ctx ? ctx.top_vehicles : 'Maruti Suzuki, Hyundai Creta, Tata Nexon EV, Bugatti Chiron, Mercedes-Benz'}
- Key Affordability Rule: Maximum recommended EMI is 40% of monthly income.`;
}

// ── 3. Chat Handler ───────────────────────────────────────────
async function chat(req, res) {
  const { userMessage, messages } = req.body;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  try {
    const ctx = getLiveContext();
    const systemPrompt = buildSystemInstruction(ctx);

    // Format full chat history for Groq
    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Append conversation history if available
    if (messages && Array.isArray(messages)) {
      messages.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          formattedMessages.push({ role: msg.role, content: msg.content });
        }
      });
    } else {
      formattedMessages.push({ role: 'user', content: userMessage.trim() });
    }

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';

    return res.status(200).json({
      success: true,
      message: reply,
    });

  } catch (err) {
    console.error('Groq Chat Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'AI service unavailable. Ensure your GROQ_API_KEY is configured.',
    });
  }
}

function getSuggestions(req, res) {
  const suggestions = [
    '🚗 Calculate EMI for ₹8L loan at 9.5% for 60 months',
    '🏎️ What is the top speed and engine of a Bugatti Chiron?',
    '⚡ How do EV batteries work compared to petrol engines?',
    '💰 Can I afford a Hyundai Creta on ₹1.2L annual income?',
    '🏆 What is the price and specs of a Swift Dzire?',
  ];
  return res.status(200).json({ success: true, suggestions });
}

module.exports = { chat, getSuggestions };