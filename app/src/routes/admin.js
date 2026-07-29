const express    = require('express');
const router     = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  getAllUsers, updateUserRole,
  getSystemStats, deleteUser
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/users',           getAllUsers);
router.get('/stats',           getSystemStats);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id',    deleteUser);

module.exports = router;