const express = require('express');
const router = express.Router();
const {validateLead} = require('../middleware/validate');
const { createLead, getLeadsByCustomer } = require('../controllers/leadsController');

router.post('/', validateLead, createLead);
router.get('/:customerId', getLeadsByCustomer);
module.exports = router;