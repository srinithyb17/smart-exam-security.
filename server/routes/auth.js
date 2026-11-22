const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Admin Login
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const validPassword = bcrypt.compareSync(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Admin authenticated successfully',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Login
router.post('/student/login', (req, res) => {
  try {
    const { register_number, password } = req.body;
    if (!register_number || !password) {
      return res.status(400).json({ error: 'Register number and password are required' });
    }

    const regNo = register_number.trim().toUpperCase();
    const student = db.prepare('SELECT * FROM students WHERE UPPER(register_number) = ?').get(regNo);
    if (!student) {
      return res.status(401).json({ error: 'Student with this register number not found' });
    }

    const validPassword = bcrypt.compareSync(password, student.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: student.id,
        register_number: student.register_number,
        name: student.name,
        department: student.department,
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Record login timestamp in security logs
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    try {
      db.prepare(`
        INSERT INTO security_logs (exam_id, student_id, event_type, severity, details, ip_address, timestamp)
        VALUES (0, ?, 'STUDENT_LOGIN', 'LOW', 'Student logged into portal', ?, CURRENT_TIMESTAMP)
      `).run(student.id, ip);
    } catch (_) {}

    res.json({
      message: 'Student authenticated successfully',
      token,
      user: {
        id: student.id,
        register_number: student.register_number,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        section: student.section,
        role: 'student'
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Current User Profile Verification
router.get('/me', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const admin = db.prepare('SELECT id, username, name, email, role FROM admins WHERE id = ?').get(req.user.id);
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
      return res.json({ user: admin });
    } else {
      const student = db.prepare('SELECT id, register_number, name, email, department, year, section FROM students WHERE id = ?').get(req.user.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      return res.json({ user: { ...student, role: 'student' } });
    }
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
