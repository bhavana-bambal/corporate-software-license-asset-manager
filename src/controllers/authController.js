const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = await db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Log login event
      await logAudit({
        user: `${user.name} (${user.email})`,
        role: user.role,
        action: 'LOGIN',
        module: 'AUTH',
        recordId: user.id,
        description: `User successfully logged into the Corporate License & Asset Manager.`
      });

      const userPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId || null,
        avatar: user.avatar || null
      };

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userPayload
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
    }
  },

  async getMe(req, res) {
    try {
      const user = await db.findById('users', req.user.id, 'id');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          employeeId: user.employeeId || null,
          avatar: user.avatar || null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Helper endpoint to easily switch demo users for evaluation
  async switchDemoRole(req, res) {
    try {
      const { role } = req.body;
      const targetRole = (role || 'ADMIN').toUpperCase();
      const user = await db.findOne('users', u => u.role === targetRole);

      if (!user) {
        return res.status(404).json({ success: false, message: `Demo user for role ${targetRole} not found.` });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await logAudit({
        user: `${user.name} (${user.email})`,
        role: user.role,
        action: 'ROLE_SWITCH',
        module: 'AUTH',
        recordId: user.id,
        description: `Evaluator switched active session role to ${user.role}.`
      });

      res.json({
        success: true,
        message: `Switched active session to ${user.role}`,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          employeeId: user.employeeId || null,
          avatar: user.avatar || null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = authController;
