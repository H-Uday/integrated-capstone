/**
 * chatbotController.js
 * CarIQ AI Chatbot powered by Groq Cloud API
 * Automatically discovers active models and responds with smart automotive intelligence.
 */

require('dotenv').config();
const Groq   = require('groq-sdk');
const { db } = require('../config/database');

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

// ── 2. System Instructions: Personality & Automotive Intelligence
function buildSystemInstruction(ctx) {
  return `You are CarIQ, an intelligent, authentic AI automotive advisor.

### Formatting Rules:
1. Always output tables with standard markdown syntax, ensuring header and separator rows (|---|---|) are on new lines.
2. For mathematical formulas, write them cleanly in standard text or inline code (e.g., \`EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]\`). Do NOT use LaTeX block syntax like $$ or \\frac{}{}.
3. Keep bullet points, numbered lists, and headings properly separated by blank lines for clean parsing.

### CarIQ Live Database Snapshot:
- Tracked Vehicles: ${ctx ? ctx.vehicles : 26}
- Total Customers: ${ctx ? ctx.customers : 170}
- Sample Catalog: ${ctx ? ctx.top_vehicles : 'Maruti Suzuki Swift, Tata Nexon EV, Hyundai Creta, BMW 5 Series, Bugatti Chiron'}`;
}

// ── 3. Helper: Resolve the Best Active Model Dynamically ───────
async function getActiveModel(groq) {
  try {
    const modelList = await groq.models.list();
    const activeIds = modelList.data.map(m => m.id);

    // Preferred priority order of active production chat models
    const preference = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'llama-3.3-70b-specdec',
      'qwen/qwen3-32b',
      'openai/gpt-oss-120b'
    ];

    const matched = preference.find(p => activeIds.includes(p));
    return matched || activeIds[0] || 'llama-3.3-70b-versatile';
  } catch (err) {
    // Fallback if listing endpoint fails
    return 'llama-3.3-70b-versatile';
  }
}

// ── 4. Chat Handler ───────────────────────────────────────────
async function chat(req, res) {
  const { userMessage, messages } = req.body;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      message: '⚡ [Demo Mode]: Groq API Key is not set in Render environment variables.',
    });
  }

  try {
    const groq = new Groq({ apiKey });
    const ctx = getLiveContext();
    const systemPrompt = buildSystemInstruction(ctx);

    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    if (messages && Array.isArray(messages)) {
      messages.forEach(msg => {
        if (msg.role && msg.content) {
          formattedMessages.push({ role: msg.role, content: msg.content });
        }
      });
    } else {
      formattedMessages.push({ role: 'user', content: userMessage.trim() });
    }

    // Automatically select the active model for your account
    const selectedModel = await getActiveModel(groq);

    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages,
      temperature: 0.6,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';
    return res.status(200).json({ success: true, message: reply });

  } catch (err) {
    console.error('Groq Chat Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'AI service unavailable: ' + err.message,
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