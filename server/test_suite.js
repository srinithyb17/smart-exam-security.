const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('🧪 Starting Smart Exam Security Test Suite...\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'healthy', 'Health check must return healthy');
  console.log('✅ Test 1: System Health Check OK');

  // 2. Admin Authentication
  const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminAuth = await adminLoginRes.json();
  assert.ok(adminAuth.token, 'Admin login must return JWT token');
  assert.strictEqual(adminAuth.user.role, 'admin', 'Admin role must be admin');
  console.log('✅ Test 2: Admin Authentication & RBAC OK');

  const adminToken = adminAuth.token;

  // 3. Student Authentication
  const studentLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ register_number: '910021104001', password: 'student123' })
  });
  const studentAuth = await studentLoginRes.json();
  assert.ok(studentAuth.token, 'Student login must return JWT token');
  assert.strictEqual(studentAuth.user.role, 'student', 'Student role must be student');
  console.log('✅ Test 3: Student Authentication & Credentials OK');

  const studentToken = studentAuth.token;
  const studentId = studentAuth.user.id;

  // 4. Student Management: Add Student & Duplicate Protection
  const testRegNo = '91002' + Math.floor(100000 + Math.random() * 900000);
  const addStudentRes = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      register_number: testRegNo,
      name: 'Automated Test Candidate',
      email: 'testcandidate@clg.edu',
      department: 'CSE',
      year: 'IV',
      section: 'A'
    })
  });
  const addStudentData = await addStudentRes.json();
  const createdTestStudentId = addStudentData.student?.id;
  assert.strictEqual(addStudentRes.status, 201, 'Student creation should return 201');
  console.log('✅ Test 4: Student Registration OK');

  // Test duplicate prevention
  const dupStudentRes = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      register_number: testRegNo,
      name: 'Duplicate Candidate'
    })
  });
  assert.strictEqual(dupStudentRes.status, 400, 'Duplicate register number must be rejected');
  console.log('✅ Test 5: Unique Register Number Enforcement OK');

  // 5. Exam Query & Active Verification
  const examsRes = await fetch(`${BASE_URL}/exams`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const examsData = await examsRes.json();
  assert.ok(examsData.exams.length > 0, 'Exams list should contain at least 1 seeded exam');
  const sampleExam = examsData.exams.find(e => e.exam_code === 'CS8591') || examsData.exams[0];
  console.log(`✅ Test 6: Exam Query OK (Exam: ${sampleExam.exam_code} - ${sampleExam.title})`);

  // 6. Protected PDF Access Restriction (Unauthenticated should be 401)
  const unauthPdfRes = await fetch(`${BASE_URL}/exams/${sampleExam.id}/paper`);
  assert.strictEqual(unauthPdfRes.status, 401, 'PDF access without auth token must return 401 Unauthorized');
  console.log('✅ Test 7: Protected PDF Access (Unauthorized Request Blocked) OK');

  // 7. Start Exam Session (Single-Session Enforcement)
  // Ensure clean session state using newly added admin Remove from Cockpit endpoint
  const existingSessionsRes = await fetch(`${BASE_URL}/sessions/exam/${sampleExam.id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const existingData = await existingSessionsRes.json();
  const prevSession = (existingData.sessions || []).find(s => s.student_id === studentId);
  if (prevSession) {
    await fetch(`${BASE_URL}/sessions/${prevSession.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  }

  const startSessionRes = await fetch(`${BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ examId: sampleExam.id })
  });
  const sessionData = await startSessionRes.json();
  assert.ok(sessionData.sessionToken, 'Session start must return unique sessionToken');
  const sessionToken = sessionData.sessionToken;
  console.log('✅ Test 8: Exam Session Initialized (Token Generated) OK');

  // 8. Multiple Device / Unauthorized Concurrent Login Detection
  const conflictingLoginRes = await fetch(`${BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      clientSessionToken: 'foreign_unauthorized_device_token_abc'
    })
  });
  assert.strictEqual(conflictingLoginRes.status, 409, 'Concurrent session from another device must return 409 Conflict');
  console.log('✅ Test 9: Single-Session Enforcement & Multi-Device Login Detection OK');

  // 9. Heartbeat Verification
  const heartbeatRes = await fetch(`${BASE_URL}/sessions/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      sessionToken: sessionToken
    })
  });
  const heartbeatData = await heartbeatRes.json();
  assert.strictEqual(heartbeatData.ok, true, 'Heartbeat must succeed');
  assert.ok(heartbeatData.remainingSeconds > 0, 'Remaining seconds should be returned');
  console.log(`✅ Test 10: Real-Time Heartbeat Synced OK (Remaining: ${heartbeatData.remainingSeconds}s)`);

  // 10. Malpractice Telemetry & Automatic Session Lockout
  console.log('   Simulating student malpractice violations (Tab switches)...');
  await fetch(`${BASE_URL}/telemetry/security-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      sessionToken,
      eventType: 'TAB_SWITCH',
      details: 'Test violation 1: Tab switched'
    })
  });

  await fetch(`${BASE_URL}/telemetry/security-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      sessionToken,
      eventType: 'WINDOW_BLUR',
      details: 'Test violation 2: Window blurred'
    })
  });

  const thirdViolationRes = await fetch(`${BASE_URL}/telemetry/security-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      sessionToken,
      eventType: 'FULLSCREEN_EXIT',
      details: 'Test violation 3: Fullscreen exited'
    })
  });
  const thirdViolationData = await thirdViolationRes.json();
  assert.strictEqual(thirdViolationData.locked, true, 'Session must lock after exceeding max violations threshold');
  console.log('✅ Test 11: Malpractice Detection & Auto-Lockout Threshold (3 Strikes) OK');

  // 11. Locked Session Paper Revocation
  const lockedPaperRes = await fetch(`${BASE_URL}/exams/${sampleExam.id}/paper`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert.strictEqual(lockedPaperRes.status, 403, 'Locked session must have question paper access revoked');
  console.log('✅ Test 12: Question Paper Access Revocation on Lockout OK');

  // 12. Student Session Reset Request
  const appealRes = await fetch(`${BASE_URL}/sessions/request-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      reason: 'Network hiccup caused browser freeze. Requesting invigilator approval.'
    })
  });
  const appealData = await appealRes.json();
  assert.ok(appealData.message, 'Reset request must be recorded');
  console.log('✅ Test 13: Student Reset Appeal Submission OK');

  // 13. Admin Approval of Reset Request
  const sessionsRes = await fetch(`${BASE_URL}/sessions/exam/${sampleExam.id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const sessionsList = await sessionsRes.json();
  const lockedSession = sessionsList.sessions.find(s => s.student_id === studentId);
  assert.ok(lockedSession, 'Locked session must appear in admin monitor');
  assert.strictEqual(lockedSession.reset_status, 'REQUESTED', 'Session reset status must be REQUESTED');

  const approveRes = await fetch(`${BASE_URL}/sessions/${lockedSession.id}/approve-reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(approveRes.status, 200, 'Admin reset approval should return 200');
  console.log('✅ Test 14: Admin Invigilator Reset Approval OK');

  // 14. Student Resumes & Submits Exam
  const resumeRes = await fetch(`${BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ examId: sampleExam.id })
  });
  const resumeData = await resumeRes.json();
  assert.ok(resumeData.sessionToken, 'Student should receive fresh session token after reset');

  const submitRes = await fetch(`${BASE_URL}/sessions/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      examId: sampleExam.id,
      sessionToken: resumeData.sessionToken
    })
  });
  assert.strictEqual(submitRes.status, 200, 'Student exam submission must succeed');
  console.log('✅ Test 15: Student Exam Submission OK');

  // 15. Reports & Audit Trail Verification
  const reportRes = await fetch(`${BASE_URL}/reports/exam/${sampleExam.id}/participation`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const reportData = await reportRes.json();
  assert.ok(reportData.summary.total_submitted >= 1, 'Report must reflect submitted count');
  console.log('✅ Test 16: Audit Trail & Participation Reports OK');

  // 16. CSV Report Export
  const csvRes = await fetch(`${BASE_URL}/reports/exam/${sampleExam.id}/export-csv`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Register Number'), 'CSV must contain headers');
  assert.ok(csvText.includes('910021104001'), 'CSV must contain student register number');
  console.log('✅ Test 17: Official CSV Report Generation & Download OK');

  // Clean up temporary test student
  if (createdTestStudentId) {
    await fetch(`${BASE_URL}/students/${createdTestStudentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(() => {});
  }

  console.log('\n🎉 ALL 17 AUTOMATED INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

module.exports = runTestSuite;
