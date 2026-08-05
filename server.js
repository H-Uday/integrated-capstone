
// Ollama Chatbot Route with Render Fallback
app.post('/api/chatbot/chat', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: req.body.userMessage || req.body.prompt,
        stream: false
      })
    });
    const data = await response.json();
    res.json({ success: true, message: data.response });

  } catch (error) {
    res.json({ 
      success: true, 
      message: "⚡ [CarIQ Assistant]: Connected to live server. Local Ollama engine is unreachable in demo mode." 
    });
  }
});
