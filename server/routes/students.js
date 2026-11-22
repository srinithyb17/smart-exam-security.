const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadCsv } = require('../middleware/upload');

// All student management routes require admin access
router.use(authenticateToken, requireAdmin);

// Get students list with search, filter, pagination
router.get('/', (req, res) => {
  try {
    const { search = '', department = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countQuery = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
    let dataQuery = 'SELECT id, register_number, name, email, department, year, section, created_at FROM students WHERE 1=1';
    const params = [];

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      countQuery += ' AND (register_number LIKE ? OR name LIKE ? OR email LIKE ?)';
      dataQuery += ' AND (register_number LIKE ? OR name LIKE ? OR email LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (department) {
      countQuery += ' AND department = ?';
      dataQuery += ' AND department = ?';
      params.push(department);
    }

    const countParams = [...params];
    dataQuery += ' ORDER BY register_number ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const total = db.prepare(countQuery).get(...countParams).total;
    const students = db.prepare(dataQuery).all(...params);

    // Get unique departments for filter dropdown
    const departments = db.prepare('SELECT DISTINCT department FROM students WHERE department IS NOT NULL AND department != "" ORDER BY department').all().map(d => d.department);

    res.json({
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      departments
    });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create single student
router.post('/', (req, res) => {
  try {
    const { register_number, name, email, department, year, section, password } = req.body;
    if (!register_number || !name) {
      return res.status(400).json({ error: 'Register number and name are required' });
    }

    const regNo = register_number.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM students WHERE register_number = ?').get(regNo);
    if (existing) {
      return res.status(400).json({ error: 'Student with this register number already exists' });
    }

    const pwd = password && password.trim() ? password.trim() : regNo; // default password is reg no
    const password_hash = bcrypt.hashSync(pwd, 10);

    const result = db.prepare(`
      INSERT INTO students (register_number, name, email, department, year, section, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(regNo, name.trim(), email ? email.trim() : null, department || null, year || null, section || null, password_hash);

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id: result.lastInsertRowid,
        register_number: regNo,
        name: name.trim(),
        email,
        department,
        year,
        section
      }
    });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { register_number, name, email, department, year, section, password } = req.body;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const regNo = register_number ? register_number.trim().toUpperCase() : student.register_number;

    // Check unique reg number
    if (regNo !== student.register_number) {
      const existing = db.prepare('SELECT id FROM students WHERE register_number = ? AND id != ?').get(regNo, id);
      if (existing) {
        return res.status(400).json({ error: 'Another student already has this register number' });
      }
    }

    let password_hash = student.password_hash;
    if (password && password.trim()) {
      password_hash = bcrypt.hashSync(password.trim(), 10);
    }

    db.prepare(`
      UPDATE students
      SET register_number = ?, name = ?, email = ?, department = ?, year = ?, section = ?, password_hash = ?
      WHERE id = ?
    `).run(
      regNo,
      name ? name.trim() : student.name,
      email !== undefined ? email : student.email,
      department !== undefined ? department : student.department,
      year !== undefined ? year : student.year,
      section !== undefined ? section : student.section,
      password_hash,
      id
    );

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Bulk upload CSV
router.post('/bulk-upload', uploadCsv.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a CSV file' });
  }

  const results = [];
  const errors = [];
  const filePath = req.file.path;

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch (_) {}

        if (results.length === 0) {
          return res.status(400).json({ error: 'CSV file is empty' });
        }

        let insertedCount = 0;
        let skippedCount = 0;

        // Execute batch insert in SQLite transaction for high speed (1000s per sec)
        const insertStudent = db.prepare(`
          INSERT INTO students (register_number, name, email, department, year, section, password_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const checkStudent = db.prepare('SELECT id FROM students WHERE UPPER(register_number) = ?');

        const insertMany = db.transaction((rows) => {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const regNo = (row.register_number || row.RegisterNumber || row.reg_no || row.RegNo || '').toString().trim().toUpperCase();
            const name = (row.name || row.Name || row.student_name || '').toString().trim();
            const email = (row.email || row.Email || '').toString().trim();
            const department = (row.department || row.Department || row.dept || '').toString().trim();
            const year = (row.year || row.Year || '').toString().trim();
            const section = (row.section || row.Section || '').toString().trim();
            const rawPassword = (row.password || row.Password || regNo).toString().trim();

            if (!regNo || !name) {
              errors.push({ row: i + 1, error: 'Missing register number or name' });
              skippedCount++;
              continue;
            }

            const existing = checkStudent.get(regNo);
            if (existing) {
              skippedCount++;
              continue; // Skip duplicate records
            }

            const password_hash = bcrypt.hashSync(rawPassword, 8); // Fast 8 salt rounds for bulk import
            insertStudent.run(regNo, name, email || null, department || null, year || null, section || null, password_hash);
            insertedCount++;
          }
        });

        insertMany(results);

        res.json({
          message: `Bulk upload completed. Inserted: ${insertedCount}, Skipped: ${skippedCount}`,
          insertedCount,
          skippedCount,
          errors: errors.slice(0, 20) // Return max 20 errors
        });
      })
      .on('error', (err) => {
        try { fs.unlinkSync(filePath); } catch (_) {}
        res.status(500).json({ error: 'Error reading CSV file: ' + err.message });
      });
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: 'Bulk upload processing failed' });
  }
});

// Download sample CSV format
router.get('/sample-csv', (req, res) => {
  const sample = 'register_number,name,email,department,year,section,password\n' +
    '910021104001,Aarav Sharma,aarav@clg.edu,CSE,IV,A,pass123\n' +
    '910021104002,Bhavya Patel,bhavya@clg.edu,CSE,IV,A,pass123\n' +
    '910021104003,Chirag Reddy,chirag@clg.edu,ECE,III,B,pass123\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_upload_sample.csv"');
  res.send(sample);
});

module.exports = router;
