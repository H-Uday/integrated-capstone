/**
 * chatbotController.js
 * CarIQ AI Chatbot powered by Groq Cloud API
 * Authentic, intelligent, and adaptive automotive assistant.
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

// ── 2. System Instructions: Personality & Intelligence ────────
function buildSystemInstruction(ctx) {
  return `You are CarIQ, an intelligent, authentic, and sharp AI automotive collaborator with deep knowledge of cars, loan mathematics, affordability, and the auto industry.

### Personality & Tone Guidelines:
- **Direct & Helpful:** Lead with the core answer right away. Skip generic robotic intros (e.g., avoid "As an AI..." or "Here is the information you requested"). Jump straight into the explanation.
- **Tone:** Grounded, sharp, peer-like, and slightly witty when appropriate, but always accurate and professional.
- **Scannability:** Use clean Markdown formatting (**bolding**, lightweight bullet points, and short tables for specs or comparisons) to make answers easily readable.
- **Automotive & Finance Expertise:** Provide concrete math when asked about EMIs or affordability (e.g., standard formula: EMI = [P x R x (1+R)^N]/[(1+R)^N-1], rule of thumb: max 40% income allocation or 20/4/10 rule).
- **Scope:** Answer general car questions (turbos, EV range, hypercars, maintenance, segment comparisons) as well as questions about our internal inventory.

### CarIQ Live Inventory Snapshot:
- Total Tracked Vehicles: ${ctx ? ctx.vehicles : 26}
- Total Customers: ${ctx ? ctx.customers : 170}
- Sample Catalog:
  ${ctx ? ctx.top_vehicles : 'Maruti Suzuki Swift, Tata Nexon EV, Hyundai Creta, BMW 5 Series, Bugatti Chiron'}
- Key Affordability Metric: Recommended monthly EMI must not exceed 40% of net income.`;
}

// ── 3. Chat Handler ───────────────────────────────────────────
async function chat(req, res) {
  const { userMessage, messages } = req.body;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      message: '⚡ [Demo Mode]: Groq API Key is not configured on the server environment.',
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

    const candidateModels = [
      'llama-3.3-70b-specdec',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768'
    ];

    let completion = null;
    let lastError = null;

    for (const modelId of candidateModels) {
      try {
        completion = await groq.chat.completions.create({
          model: modelId,
          messages: formattedMessages,
          temperature: 0.6,
          max_tokens: 1024,
        });
        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!completion) {
      throw lastError || new Error('All model candidate endpoints failed.');
    }

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