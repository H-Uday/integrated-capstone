const express = require('express');
const router  = express.Router();
const { chat, getSuggestions } = require('../controllers/chatbotController');

router.post('/chat',        chat);
router.get('/suggestions',  getSuggestions);

module.exports = router;