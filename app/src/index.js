// CarIQ Express Application
// Phase 2 implementation begins Day 3
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'CarIQ', phase: 1 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CarIQ app running on port ${PORT}`));
