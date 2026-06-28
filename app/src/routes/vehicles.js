const express = require('express');
const router = express.Router();
const {validateVehicle} = require('../middleware/validate');
const { createVehicle, getAllVehicles } = require('../controllers/vehiclesController');

router.post('/', validateVehicle, createVehicle);
router.get('/', getAllVehicles);

module.exports = router;