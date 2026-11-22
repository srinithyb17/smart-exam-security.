const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All report routes require admin permissions
router.use(authenticateToken, requireAdmin);

// Exam Participation Report
router.get('/exam/:examId/participation', (req, res) => {
  try {
    const { examId } = req.params;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Summary counts
    const summary = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM students) as total_registered_students,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ?) as total_started,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ? AND status = 'SUBMITTED') as total_submitted,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ? AND status = 'IN_PROGRESS') as total_in_progress,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ? AND status = 'INTERRUPTED') as total_interrupted,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ? AND status = 'LOCKED') as total_locked,
        (SELECT COUNT(*) FROM exam_sessions WHERE exam_id = ? AND violations_count > 0) as students_with_violations
    `).get(examId, examId, examId, examId, examId, examId);

    // List of sessions for this exam
    const studentSessions = db.prepare(`
      SELECT 
        st.register_number,
        st.name as student_name,
        st.department,
        st.year,
        st.section,
        COALESCE(s.status, 'ABSENT') as status,
        s.start_time,
        s.end_time,
        s.violations_count,
        s.reset_status,
        s.ip_address
      FROM students st
      LEFT JOIN exam_sessions s ON s.student_id = st.id AND s.exam_id = ?
      ORDER BY 
        CASE 
          WHEN s.status = 'LOCKED' THEN 1
          WHEN s.status = 'IN_PROGRESS' THEN 2
          WHEN s.status = 'SUBMITTED' THEN 3
          WHEN s.status = 'INTERRUPTED' THEN 4
          ELSE 5
        END,
        st.register_number ASC
    `).all(examId);

    res.json({
      exam,
      summary,
      studentSessions
    });
  } catch (err) {
    console.error('Participation report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Exam Security / Malpractice Report
router.get('/exam/:examId/security', (req, res) => {
  try {
    const { examId } = req.params;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Event type distribution
    const eventBreakdown = db.prepare(`
      SELECT event_type, severity, COUNT(*) as count
      FROM security_logs
      WHERE exam_id = ?
      GROUP BY event_type, severity
      ORDER BY count DESC
    `).all(examId);

    // Top students by violation count
    const topViolators = db.prepare(`
      SELECT 
        st.register_number,
        st.name as student_name,
        st.department,
        s.status as session_status,
        s.violations_count,
        COUNT(l.id) as total_log_entries
      FROM exam_sessions s
      JOIN students st ON st.id = s.student_id
      LEFT JOIN security_logs l ON l.session_id = s.id
      WHERE s.exam_id = ? AND s.violations_count > 0
      GROUP BY s.id
      ORDER BY s.violations_count DESC, total_log_entries DESC
      LIMIT 20
    `).all(examId);

    res.json({
      exam,
      eventBreakdown,
      topViolators
    });
  } catch (err) {
    console.error('Security report error:', err);
    res.status(500).json({ error: 'Failed to generate security report' });
  }
});

// Student Individual Audit Trail
router.get('/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;

    const student = db.prepare('SELECT id, register_number, name, email, department, year, section, created_at FROM students WHERE id = ?').get(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const sessions = db.prepare(`
      SELECT s.*, e.title as exam_title, e.exam_code
      FROM exam_sessions s
      JOIN exams e ON e.id = s.exam_id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC
    `).all(studentId);

    const logs = db.prepare(`
      SELECT l.*, e.title as exam_title, e.exam_code
      FROM security_logs l
      LEFT JOIN exams e ON e.id = l.exam_id
      WHERE l.student_id = ?
      ORDER BY l.timestamp DESC
      LIMIT 100
    `).all(studentId);

    res.json({
      student,
      sessions,
      logs
    });
  } catch (err) {
    console.error('Student report error:', err);
    res.status(500).json({ error: 'Failed to fetch student report' });
  }
});

// Export Exam Report to CSV
router.get('/exam/:examId/export-csv', (req, res) => {
  try {
    const { examId } = req.params;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const sessions = db.prepare(`
      SELECT 
        st.register_number,
        st.name as student_name,
        st.department,
        st.year,
        st.section,
        COALESCE(s.status, 'NOT_STARTED') as status,
        COALESCE(s.violations_count, 0) as violations_count,
        COALESCE(s.start_time, 'N/A') as start_time,
        COALESCE(s.end_time, 'N/A') as end_time,
        COALESCE(s.ip_address, 'N/A') as ip_address,
        COALESCE(s.reset_status, 'NONE') as reset_status
      FROM students st
      LEFT JOIN exam_sessions s ON s.student_id = st.id AND s.exam_id = ?
      ORDER BY st.register_number ASC
    `).all(examId);

    let csvContent = 'Register Number,Student Name,Department,Year,Section,Status,Violations,Start Time,End Time,IP Address,Reset Status\n';

    sessions.forEach(row => {
      csvContent += `"${row.register_number}","${row.student_name}","${row.department || ''}","${row.year || ''}","${row.section || ''}","${row.status}",${row.violations_count},"${row.start_time}","${row.end_time}","${row.ip_address}","${row.reset_status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exam.exam_code}_report.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

module.exports = router;
