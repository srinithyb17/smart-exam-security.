const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken, requireAdmin, requireStudent } = require('../middleware/auth');

// Helper to log security events
function logSecurityEvent(examId, studentId, eventType, severity, details, ip) {
  try {
    db.prepare(`
      INSERT INTO security_logs (exam_id, student_id, event_type, severity, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(examId, studentId, eventType, severity, details, ip);
  } catch (e) {
    console.error('Error logging security event:', e);
  }
}

// Student: Start or resume exam session (Single-Session Enforcement)
router.post('/start', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, clientSessionToken } = req.body;
    const studentId = req.user.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      return res.status(403).json({ error: 'Exam has not started yet. Starts at ' + exam.start_time });
    }
    if (now > endTime) {
      return res.status(403).json({ error: 'Exam has already ended' });
    }

    // Look for existing session for this student and exam
    let session = db.prepare(`
      SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ?
    `).get(examId, studentId);

    if (session) {
      // 1. Check if already submitted
      if (session.status === 'SUBMITTED') {
        return res.status(403).json({
          error: 'Exam already submitted',
          status: 'SUBMITTED',
          submittedAt: session.end_time
        });
      }

      // 2. Check if locked due to malpractice
      if (session.status === 'LOCKED') {
        return res.status(403).json({
          error: 'Your exam session is locked due to security policy violations',
          status: 'LOCKED',
          violationsCount: session.violations_count,
          resetStatus: session.reset_status
        });
      }

      // 3. Single-Session Enforcement & Multiple Login Detection
      if (session.status === 'IN_PROGRESS') {
        // If client session token does not match active session token
        if (clientSessionToken && clientSessionToken !== session.session_token) {
          logSecurityEvent(
            examId,
            studentId,
            'UNAUTHORIZED_LOGIN',
            'CRITICAL',
            `Attempted multiple concurrent logins from IP ${ip}. Existing active session detected.`,
            ip
          );
          return res.status(409).json({
            error: 'Active exam session detected on another device or tab. Multiple logins are prohibited.',
            status: 'CONFLICT'
          });
        }
      }

      // If session was interrupted or reset approved, allow re-activation
      const newToken = uuidv4();
      db.prepare(`
        UPDATE exam_sessions SET
          session_token = ?,
          status = 'IN_PROGRESS',
          ip_address = ?,
          user_agent = ?,
          last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newToken, ip, userAgent, session.id);

      logSecurityEvent(examId, studentId, 'SESSION_RESUMED', 'LOW', 'Student resumed exam session', ip);

      return res.json({
        message: 'Exam session resumed',
        sessionToken: newToken,
        sessionId: session.id,
        exam: {
          id: exam.id,
          title: exam.title,
          exam_code: exam.exam_code,
          duration_minutes: exam.duration_minutes,
          max_violations: exam.max_violations,
          instructions: exam.instructions
        },
        violationsCount: session.violations_count,
        startTime: session.start_time
      });
    }

    // First time starting: Create new authorized session
    const sessionToken = uuidv4();
    const result = db.prepare(`
      INSERT INTO exam_sessions (
        exam_id, student_id, session_token, status, start_time, last_heartbeat, ip_address, user_agent
      ) VALUES (?, ?, ?, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
    `).run(examId, studentId, sessionToken, ip, userAgent);

    logSecurityEvent(examId, studentId, 'EXAM_STARTED', 'LOW', 'Authorized exam session started', ip);

    res.status(201).json({
      message: 'Exam session initialized',
      sessionToken,
      sessionId: result.lastInsertRowid,
      exam: {
        id: exam.id,
        title: exam.title,
        exam_code: exam.exam_code,
        duration_minutes: exam.duration_minutes,
        max_violations: exam.max_violations,
        instructions: exam.instructions
      },
      violationsCount: 0,
      startTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start exam session' });
  }
});

// Student: Periodic Heartbeat (every 15-20s)
router.post('/heartbeat', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, sessionToken } = req.body;
    const studentId = req.user.id;

    if (!examId || !sessionToken) {
      return res.status(400).json({ error: 'Missing examId or sessionToken' });
    }

    const session = db.prepare(`
      SELECT s.*, e.end_time, e.duration_minutes, e.max_violations
      FROM exam_sessions s
      JOIN exams e ON e.id = s.exam_id
      WHERE s.exam_id = ? AND s.student_id = ?
    `).get(examId, studentId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Token verification
    if (session.session_token !== sessionToken) {
      return res.status(403).json({
        locked: true,
        status: 'INVALID_TOKEN',
        message: 'Invalid session credentials. Another session may have taken over.'
      });
    }

    // Check if session locked
    if (session.status === 'LOCKED') {
      return res.json({
        locked: true,
        status: 'LOCKED',
        violationsCount: session.violations_count,
        message: 'Exam session is locked due to security policy violations.'
      });
    }

    // Check if already submitted
    if (session.status === 'SUBMITTED') {
      return res.json({
        submitted: true,
        status: 'SUBMITTED',
        message: 'Exam already submitted.'
      });
    }

    // Check time expiry
    const now = new Date();
    const examEndTime = new Date(session.end_time);
    if (now >= examEndTime) {
      db.prepare(`
        UPDATE exam_sessions SET status = 'SUBMITTED', end_time = CURRENT_TIMESTAMP WHERE id = ?
      `).run(session.id);

      logSecurityEvent(examId, studentId, 'SESSION_EXPIRED', 'LOW', 'Exam automatically closed due to time expiry', '127.0.0.1');

      return res.json({
        expired: true,
        status: 'SUBMITTED',
        message: 'Exam time expired. Submitted automatically.'
      });
    }

    // Update heartbeat
    db.prepare(`
      UPDATE exam_sessions SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?
    `).run(session.id);

    // Calculate remaining seconds
    const remainingSeconds = Math.max(0, Math.floor((examEndTime - now) / 1000));

    res.json({
      ok: true,
      status: session.status,
      violationsCount: session.violations_count,
      remainingSeconds
    });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Student: Submit exam
router.post('/submit', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, sessionToken } = req.body;
    const studentId = req.user.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const session = db.prepare(`
      SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ? AND session_token = ?
    `).get(examId, studentId, sessionToken);

    if (!session) {
      return res.status(404).json({ error: 'Valid active session not found' });
    }

    db.prepare(`
      UPDATE exam_sessions SET status = 'SUBMITTED', end_time = CURRENT_TIMESTAMP WHERE id = ?
    `).run(session.id);

    logSecurityEvent(examId, studentId, 'EXAM_SUBMITTED', 'LOW', 'Student completed and submitted exam', ip);

    res.json({ message: 'Exam submitted successfully' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// Student: Session Interruption (browser closed, tab closed, crash)
router.post('/interrupt', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, sessionToken } = req.body;
    const studentId = req.user.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const session = db.prepare(`
      SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ?
    `).get(examId, studentId);

    if (session && session.status === 'IN_PROGRESS') {
      db.prepare(`
        UPDATE exam_sessions SET status = 'INTERRUPTED' WHERE id = ?
      `).run(session.id);

      logSecurityEvent(examId, studentId, 'SESSION_INTERRUPTED', 'MEDIUM', 'Student tab or browser closed abruptly', ip);
    }

    res.json({ message: 'Interruption recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record interruption' });
  }
});

// Student: Request reset for interrupted / locked session
router.post('/request-reset', authenticateToken, requireStudent, (req, res) => {
  try {
    const { examId, reason } = req.body;
    const studentId = req.user.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!examId || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for session reset is required' });
    }

    const session = db.prepare(`
      SELECT * FROM exam_sessions WHERE exam_id = ? AND student_id = ?
    `).get(examId, studentId);

    if (!session) {
      return res.status(404).json({ error: 'No exam session found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.status(400).json({ error: 'Completed exams cannot be reset by student request' });
    }

    db.prepare(`
      UPDATE exam_sessions SET
        reset_status = 'REQUESTED',
        reset_reason = ?,
        reset_requested_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason.trim(), session.id);

    logSecurityEvent(
      examId,
      studentId,
      'RESET_REQUESTED',
      'MEDIUM',
      `Student requested session unlock/reset: "${reason.trim()}"`,
      ip
    );

    res.json({ message: 'Reset request submitted to administrator for approval' });
  } catch (err) {
    console.error('Reset request error:', err);
    res.status(500).json({ error: 'Failed to submit reset request' });
  }
});

// Admin: Real-Time Exam Monitoring (active sessions, heartbeats, status)
router.get('/exam/:examId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { examId } = req.params;

    const sessions = db.prepare(`
      SELECT 
        s.*,
        st.register_number,
        st.name as student_name,
        st.department,
        st.year,
        st.section,
        (
          SELECT json_group_array(
            json_object('event_type', l.event_type, 'severity', l.severity, 'timestamp', l.timestamp, 'details', l.details)
          )
          FROM (SELECT * FROM security_logs WHERE session_id = s.id OR (exam_id = s.exam_id AND student_id = s.student_id) ORDER BY timestamp DESC LIMIT 5) l
        ) as recent_logs
      FROM exam_sessions s
      JOIN students st ON st.id = s.student_id
      WHERE s.exam_id = ?
      ORDER BY 
        CASE 
          WHEN s.reset_status = 'REQUESTED' THEN 1
          WHEN s.status = 'LOCKED' THEN 2
          WHEN s.status = 'IN_PROGRESS' THEN 3
          WHEN s.status = 'INTERRUPTED' THEN 4
          ELSE 5
        END,
        s.violations_count DESC,
        s.last_heartbeat DESC
    `).all(examId);

    res.json({ sessions });
  } catch (err) {
    console.error('Fetch exam sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Admin: Approve session reset
router.post('/:id/approve-reset', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    db.prepare(`
      UPDATE exam_sessions SET
        status = 'NOT_STARTED',
        session_token = NULL,
        violations_count = 0,
        reset_status = 'APPROVED',
        reset_reviewed_at = CURRENT_TIMESTAMP,
        reset_reviewed_by = ?
      WHERE id = ?
    `).run(req.user.id, id);

    logSecurityEvent(
      session.exam_id,
      session.student_id,
      'RESET_APPROVED',
      'LOW',
      `Administrator (${req.user.username}) approved session reset`,
      req.ip || '127.0.0.1'
    );

    res.json({ message: 'Session reset approved. Student can now restart their exam.' });
  } catch (err) {
    console.error('Approve reset error:', err);
    res.status(500).json({ error: 'Failed to approve reset' });
  }
});

// Admin: Reject session reset
router.post('/:id/reject-reset', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    db.prepare(`
      UPDATE exam_sessions SET
        reset_status = 'REJECTED',
        reset_reviewed_at = CURRENT_TIMESTAMP,
        reset_reviewed_by = ?
      WHERE id = ?
    `).run(req.user.id, id);

    logSecurityEvent(
      session.exam_id,
      session.student_id,
      'RESET_REJECTED',
      'MEDIUM',
      `Administrator (${req.user.username}) rejected session reset`,
      req.ip || '127.0.0.1'
    );

    res.json({ message: 'Session reset rejected' });
  } catch (err) {
    console.error('Reject reset error:', err);
    res.status(500).json({ error: 'Failed to reject reset' });
  }
});

// Admin: Force lock a student's session manually
router.post('/:id/force-lock', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    db.prepare(`
      UPDATE exam_sessions SET status = 'LOCKED' WHERE id = ?
    `).run(id);

    logSecurityEvent(
      session.exam_id,
      session.student_id,
      'ADMIN_FORCE_LOCKED',
      'CRITICAL',
      `Administrator (${req.user.username}) manually locked student session`,
      req.ip || '127.0.0.1'
    );

    res.json({ message: 'Student session locked by administrator' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to lock session' });
  }
});

module.exports = router;
