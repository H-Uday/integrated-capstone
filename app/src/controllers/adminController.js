const { db } = require('../config/database');

// GET /api/admin/users — list all registered users
function getAllUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT user_id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return res.status(200).json({
      success: true,
      count:   users.length,
      data:    users,
    });
  } catch (err) {
    console.error('getAllUsers error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// PATCH /api/admin/users/:id/role — update user role
function updateUserRole(req, res) {
  const { id }   = req.params;
  const { role } = req.body;

  const validRoles = ['admin', 'dealer', 'analyst'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error:   `role must be one of: ${validRoles.join(', ')}`,
    });
  }

  // Prevent self-demotion
  if (parseInt(id) === req.user.user_id) {
    return res.status(400).json({
      success: false,
      error:   'Cannot change your own role',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, error: `User ${id} not found` });
    }

    db.prepare('UPDATE users SET role = ? WHERE user_id = ?').run(role, Number(id));

    return res.status(200).json({
      success:  true,
      message:  `User ${user.username} role updated to ${role}`,
      user_id:  Number(id),
      new_role: role,
    });
  } catch (err) {
    console.error('updateUserRole error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET /api/admin/stats — system overview stats
function getSystemStats(req, res) {
  try {
    const customers    = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
    const vehicles     = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
    const leads        = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
    const transactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
    const users        = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

    const byRole = db.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();

    const recentLeads = db.prepare(`
      SELECT l.lead_id, l.status, l.enquiry_date,
             c.full_name, v.make, v.model
      FROM leads l
      JOIN customers c ON l.customer_id = c.customer_id
      JOIN vehicles  v ON l.vehicle_id  = v.vehicle_id
      ORDER BY l.created_at DESC LIMIT 5
    `).all();

    return res.status(200).json({
      success: true,
      stats: {
        customers, vehicles, leads,
        transactions, users,
        users_by_role: byRole,
      },
      recent_leads: recentLeads,
    });
  } catch (err) {
    console.error('getSystemStats error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// DELETE /api/admin/users/:id — remove a user
function deleteUser(req, res) {
  const { id } = req.params;

  if (parseInt(id) === req.user.user_id) {
    return res.status(400).json({
      success: false,
      error:   'Cannot delete your own account',
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, error: `User ${id} not found` });
    }

    db.prepare('DELETE FROM users WHERE user_id = ?').run(Number(id));

    return res.status(200).json({
      success: true,
      message: `User ${user.username} deleted successfully`,
    });
  } catch (err) {
    console.error('deleteUser error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { getAllUsers, updateUserRole, getSystemStats, deleteUser };