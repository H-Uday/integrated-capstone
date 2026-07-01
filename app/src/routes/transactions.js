const express = require('express');
const router = express.Router();
const { validateTransaction } = require('../middleware/validate');
const { createTransaction, getTransactionByLead } = require('../controllers/transactionsController');

router.post('/', validateTransaction, createTransaction);
router.get('/:leadId', getTransactionByLead);

module.exports = router;