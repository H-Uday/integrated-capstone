// const express    = require('express');
// const router     = express.Router();
// const { register, login } = require('../controllers/authController');

// router.post('/register', register);
// router.post('/login',    login);

// module.exports = router;

const express    = require('express');
const router     = express.Router();
const { register, login } = require('../controllers/authController');
const { requireAuth }     = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);

// GET /api/auth/me — returns current user profile from token
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      user_id:  req.user.user_id,
      username: req.user.username,
      role:     req.user.role,
    }
  });
});

module.exports = router;