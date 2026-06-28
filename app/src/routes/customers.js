const express = require('express');
const router = express.Router();
const { validateCustomer } = require('../middleware/validate');
const { createCustomer, getCustomerById } = require('../controllers/customersController');

router.post('/', validateCustomer, createCustomer);
router.get('/:id', getCustomerById);

module.exports = router;