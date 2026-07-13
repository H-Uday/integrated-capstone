// const express = require('express');
// const router = express.Router();
// const { validateCustomer } = require('../middleware/validate');
// const { createCustomer, getCustomerById } = require('../controllers/customersController');
// const { createCustomer, getCustomerById, getCustomerCount } = require('../controllers/customersController');
// router.get('/count', getCustomerCount);

// router.post('/', validateCustomer, createCustomer);
// router.get('/:id', getCustomerById);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { validateCustomer } = require('../middleware/validate');
const { createCustomer, getCustomerById, getCustomerCount } = require('../controllers/customersController');

router.get('/count', getCustomerCount);
router.post('/', validateCustomer, createCustomer);
router.get('/:id', getCustomerById);

module.exports = router;