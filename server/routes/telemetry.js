const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin, requireStudent } = require('../middleware/auth');

// Map event types to severity levels
const EVENT_SEVERITY = {
  TAB_SWITCH: 'HIGH',
  WINDOW_BLUR: 'MEDIUM',
  FULLSCREEN_EXIT: 'HIGH',
  DEVTOOLS_ATTEMPT: 'CRITICAL',
  PRINT_SCREEN_ATTEMPT: 'HIGH',
  COPY_PASTE_ATTEMPT: 'MEDIUM',
  RIGHT_CLICK_ATTEMPT: 'LOW',
  UNAUTHORIZED_LOGIN: 'CRITICAL',
  MULTIPLE_SESSION_ATTEMPT: 'CRITICAL',
  SESSION_INTERRUPTED: 'MEDIUM',
  PAGE_VISIBILITY_HIDDEN: 'HIGH',
};

// Student: Report Malpractice / Security Event
router.post('/security-event', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, sessionToken, eventType, details } = req.body;
    const studentId = req.user.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!examId || !eventType) {
      return res.status(400).json({ error: 'Missing examId or eventType' });
    }

    const session = db.prepare(`
      SELECT s.*, e.max_violations
      FROM exam_sessions s
      JOIN exams e ON e.id = s.exam_id
      WHERE s.exam_id = ? AND s.student_id = ?
    `).get(examId, studentId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.json({ message: 'Exam already submitted' });
    }

    const severity = EVENT_SEVERITY[eventType] || 'MEDIUM';

    // Insert security log
    db.prepare(`
      INSERT INTO security_logs (session_id, exam_id, student_id, event_type, severity, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(session.id, examId, studentId, eventType, severity, details || null, ip);

    // Minor events like right click may not count towards lockout threshold
    const isMajorViolation = eventType !== 'RIGHT_CLICK_ATTEMPT';
    let newViolationsCount = session.violations_count;

    if (isMajorViolation) {
      newViolationsCount += 1;
      const isLocked = newViolationsCount >= session.max_violations;

      db.prepare(`
        UPDATE exam_sessions SET
          violations_count = ?,
          status = CASE WHEN ? >= ? THEN 'LOCKED' ELSE status END
        WHERE id = ?
      `).run(newViolationsCount, newViolationsCount, session.max_violations, session.id);

      if (isLocked && session.status !== 'LOCKED') {
        // Log critical lockout event
        db.prepare(`
          INSERT INTO security_logs (session_id, exam_id, student_id, event_type, severity, details, ip_address, timestamp)
          VALUES (?, ?, ?, 'SESSION_LOCKED', 'CRITICAL', 'Student session automatically locked due to exceeding permitted malpractice violations', ?, CURRENT_TIMESTAMP)
        `).run(session.id, examId, studentId, ip);

        return res.json({
          locked: true,
          violationsCount: newViolationsCount,
          maxViolations: session.max_violations,
          message: 'Exam session locked! Maximum violations reached. Contact the invigilator.'
        });
      }
    }

    res.json({
      locked: session.status === 'LOCKED',
      violationsCount: newViolationsCount,
      maxViolations: session.max_violations
    });
  } catch (err) {
    console.error('Security event error:', err);
    res.status(500).json({ error: 'Failed to record security event' });
  }
});

// Admin: Query Security Logs with filtering
router.get('/logs', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { examId, studentId, eventType, severity, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (examId) {
      whereClause += ' AND l.exam_id = ?';
      params.push(examId);
    }
    if (studentId) {
      whereClause += ' AND l.student_id = ?';
      params.push(studentId);
    }
    if (eventType) {
      whereClause += ' AND l.event_type = ?';
      params.push(eventType);
    }
    if (severity) {
      whereClause += ' AND l.severity = ?';
      params.push(severity);
    }

    const countQuery = `SELECT COUNT(*) as total FROM security_logs l ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    const dataQuery = `
      SELECT 
        l.*,
        st.register_number,
        st.name as student_name,
        st.department,
        e.title as exam_title,
        e.exam_code
      FROM security_logs l
      LEFT JOIN students st ON st.id = l.student_id
      LEFT JOIN exams e ON e.id = l.exam_id
      ${whereClause}
      ORDER BY l.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const logs = db.prepare(dataQuery).all(...params);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch security logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Admin: Live alerts ticker / notifications
router.get('/alerts', authenticateToken, requireAdmin, (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT 
        l.*,
        st.register_number,
        st.name as student_name,
        e.title as exam_title
      FROM security_logs l
      JOIN students st ON st.id = l.student_id
      JOIN exams e ON e.id = l.exam_id
      WHERE l.severity IN ('HIGH', 'CRITICAL')
      ORDER BY l.timestamp DESC
      LIMIT 15
    `).all();

    res.json({ alerts });
  } catch (err) {
    console.error('Fetch alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
