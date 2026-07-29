// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET || 'cariq_dev_secret_2026';

// function requireAuth(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       error:   'Access denied. Please log in.'
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.user      = decoded;
//     next();
//   } catch (err) {
//     return res.status(403).json({
//       success: false,
//       error:   'Invalid or expired token. Please log in again.'
//     });
//   }
// }

// function requireRole(...roles) {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         error:   `Access denied. Required role: ${roles.join(' or ')}`
//       });
//     }
//     next();
//   };
// }

// module.exports = { requireAuth, requireRole };



const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cariq_dev_secret_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error:   'Access denied. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user      = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error:   'Invalid or expired token. Please log in again.'
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error:   `Access denied. Required role: ${roles.join(' or ')}`,
        your_role: req.user?.role || 'none',
      });
    }
    next();
  };
}

// Soft auth — attaches user if token present but does not block
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {}
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };