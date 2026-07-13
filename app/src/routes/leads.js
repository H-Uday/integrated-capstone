// const express = require('express');
// const router = express.Router();
// const {validateLead} = require('../middleware/validate');
// const { createLead, getLeadsByCustomer } = require('../controllers/leadsController');
// const { createLead, getLeadsByCustomer, getLeadCount } = require('../controllers/leadsController');
// router.get('/count', getLeadCount);

// router.post('/', validateLead, createLead);
// router.get('/:customerId', getLeadsByCustomer);
// module.exports = router;

const express = require('express');
const router = express.Router();
const { validateLead } = require('../middleware/validate');
const { createLead, getLeadsByCustomer, getLeadCount } = require('../controllers/leadsController');

router.get('/count', getLeadCount);
router.post('/', validateLead, createLead);
router.get('/:customerId', getLeadsByCustomer);

module.exports = router;