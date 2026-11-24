const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadPaper } = require('../middleware/upload');

// Admin - Get all exams with comprehensive statistics
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id) as total_sessions,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id AND status = 'IN_PROGRESS') as active_sessions,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id AND status = 'SUBMITTED') as submitted_sessions,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id AND status = 'LOCKED') as locked_sessions,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = e.id AND reset_status = 'REQUESTED') as pending_resets,
        (SELECT COUNT(*) FROM security_logs WHERE exam_id = e.id) as total_security_alerts
      FROM exams e
      ORDER BY e.created_at DESC
    `).all();

    res.json({ exams });
  } catch (err) {
    console.error('Fetch exams error:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Student - Get available, upcoming, and completed exams
router.get('/student', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student access only' });
    }

    const studentId = req.user.id;
    const nowIso = new Date().toISOString();

    const exams = db.prepare(`
      SELECT 
        e.id,
        e.exam_code,
        e.title,
        e.subject,
        e.department,
        e.start_time,
        e.end_time,
        e.duration_minutes,
        e.max_violations,
        e.instructions,
        e.is_active,
        s.id as session_id,
        s.status as session_status,
        s.session_token,
        s.start_time as session_start_time,
        s.violations_count,
        s.reset_status,
        s.reset_reason
      FROM exams e
      LEFT JOIN exam_sessions s ON s.exam_id = e.id AND s.student_id = ?
      WHERE e.is_active = 1
      ORDER BY e.start_time ASC
    `).all(studentId);

    const available = [];
    const upcoming = [];
    const completed = [];

    exams.forEach(exam => {
      const isStarted = nowIso >= exam.start_time;
      const isExpired = nowIso > exam.end_time;
      const isSubmitted = exam.session_status === 'SUBMITTED';

      if (isSubmitted || isExpired) {
        completed.push({ ...exam, timingState: 'COMPLETED' });
      } else if (isStarted && !isExpired) {
        available.push({ ...exam, timingState: 'ACTIVE' });
      } else {
        upcoming.push({ ...exam, timingState: 'UPCOMING' });
      }
    });

    res.json({
      available,
      upcoming,
      completed,
      serverTime: nowIso
    });
  } catch (err) {
    console.error('Fetch student exams error:', err);
    res.status(500).json({ error: 'Failed to fetch student exams' });
  }
});

// Admin - Create new exam with PDF Question Paper
router.post('/', authenticateToken, requireAdmin, uploadPaper.single('paper'), (req, res) => {
  try {
    const {
      exam_code,
      title,
      subject,
      department,
      start_time,
      end_time,
      duration_minutes,
      max_violations = 3,
      instructions
    } = req.body;

    const resolvedSubject = (subject && subject.trim()) || (title && title.trim()) || 'General Assessment';

    if (!exam_code || !title || !start_time || !end_time || !duration_minutes) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing required exam fields' });
    }

    const code = exam_code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM exams WHERE exam_code = ?').get(code);
    if (existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Exam with this code already exists' });
    }

    const paper_filename = req.file ? req.file.filename : null;
    const paper_original_name = req.file ? req.file.originalname : null;

    const result = db.prepare(`
      INSERT INTO exams (
        exam_code, title, subject, department, start_time, end_time,
        duration_minutes, max_violations, paper_filename, paper_original_name, instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code,
      title.trim(),
      resolvedSubject,
      department || null,
      start_time,
      end_time,
      parseInt(duration_minutes),
      parseInt(max_violations) || 3,
      paper_filename,
      paper_original_name,
      instructions || null
    );

    res.status(201).json({
      message: 'Exam created and scheduled successfully',
      examId: result.lastInsertRowid
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// Admin - Update exam
router.put('/:id', authenticateToken, requireAdmin, uploadPaper.single('paper'), (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);
    if (!exam) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Exam not found' });
    }

    const {
      exam_code,
      title,
      subject,
      department,
      start_time,
      end_time,
      duration_minutes,
      max_violations,
      instructions,
      is_active
    } = req.body;

    let paper_filename = exam.paper_filename;
    let paper_original_name = exam.paper_original_name;

    if (req.file) {
      // Delete old paper if exists
      if (exam.paper_filename) {
        const oldPath = path.join(__dirname, '..', 'storage', 'papers', exam.paper_filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      paper_filename = req.file.filename;
      paper_original_name = req.file.originalname;
    }

    db.prepare(`
      UPDATE exams SET
        exam_code = COALESCE(?, exam_code),
        title = COALESCE(?, title),
        subject = COALESCE(?, subject),
        department = COALESCE(?, department),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        duration_minutes = COALESCE(?, duration_minutes),
        max_violations = COALESCE(?, max_violations),
        instructions = COALESCE(?, instructions),
        is_active = COALESCE(?, is_active),
        paper_filename = ?,
        paper_original_name = ?
      WHERE id = ?
    `).run(
      exam_code ? exam_code.trim().toUpperCase() : null,
      title ? title.trim() : null,
      subject ? subject.trim() : null,
      department,
      start_time,
      end_time,
      duration_minutes ? parseInt(duration_minutes) : null,
      max_violations ? parseInt(max_violations) : null,
      instructions,
      is_active !== undefined ? parseInt(is_active) : null,
      paper_filename,
      paper_original_name,
      id
    );

    res.json({ message: 'Exam updated successfully' });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    console.error('Update exam error:', err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// Admin - Delete exam
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (exam.paper_filename) {
      const paperPath = path.join(__dirname, '..', 'storage', 'papers', exam.paper_filename);
      if (fs.existsSync(paperPath)) {
        try { fs.unlinkSync(paperPath); } catch (_) {}
      }
    }

    db.prepare('DELETE FROM exams WHERE id = ?').run(id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error('Delete exam error:', err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Protected Question Paper Access (Specification Item 5: Question Paper Protection)
// Streamed with strict verification and zero public direct link
router.get('/:id/paper', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(id);

    if (!exam || !exam.paper_filename) {
      return res.status(404).json({ error: 'Question paper not found for this exam' });
    }

    const paperPath = path.join(__dirname, '..', 'storage', 'papers', exam.paper_filename);
    if (!fs.existsSync(paperPath)) {
      return res.status(404).json({ error: 'Paper file missing on server' });
    }

    // Role-based verification
    if (req.user.role === 'student') {
      const now = new Date();
      const startTime = new Date(exam.start_time);
      const endTime = new Date(exam.end_time);

      // 1. Time Access Enforcement
      if (now < startTime) {
        return res.status(403).json({ error: 'Question paper is not released yet. Accessible only at scheduled start time.' });
      }
      if (now > endTime) {
        return res.status(403).json({ error: 'Exam duration has ended. Question paper access has expired.' });
      }

      // 2. Active Session Enforcement
      const session = db.prepare(`
        SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ?
      `).get(exam.id, req.user.id);

      if (!session) {
        return res.status(403).json({ error: 'No authorized exam session found. Please enter through the exam portal.' });
      }

      if (session.status === 'LOCKED') {
        return res.status(403).json({ error: 'Your exam session is locked due to security policy. Paper access revoked.' });
      }

      if (session.status === 'SUBMITTED') {
        return res.status(403).json({ error: 'You have already submitted this exam. Paper access revoked.' });
      }
    }

    // Serve PDF via secure streaming headers preventing caching and direct download controls
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="question_paper.pdf"');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(paperPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Stream paper error:', err);
    res.status(500).json({ error: 'Failed to retrieve question paper' });
  }
});

module.exports = router;
