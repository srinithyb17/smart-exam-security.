const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('./database');

async function seed() {
  console.log('Seeding initial data...');
  await db.init();

  // 1. Seed Admin
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO admins (username, password_hash, name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', adminPassHash, 'Chief Examination Officer', 'examcell@college.edu', 'admin');
    console.log('✅ Created default admin account: username "admin", password "admin123"');
  } else {
    console.log('ℹ️ Admin account already exists');
  }

  // 2. Seed Sample Students
  const sampleStudents = [
    { reg: '910021104001', name: 'Aarav Sharma', email: 'aarav@clg.edu', dept: 'CSE', year: 'IV', sec: 'A' },
    { reg: '910021104002', name: 'Bhavya Patel', email: 'bhavya@clg.edu', dept: 'CSE', year: 'IV', sec: 'A' },
    { reg: '910021104003', name: 'Chirag Reddy', email: 'chirag@clg.edu', dept: 'ECE', year: 'IV', sec: 'B' },
    { reg: '910021104004', name: 'Divya Sundaram', email: 'divya@clg.edu', dept: 'IT', year: 'III', sec: 'A' },
    { reg: '910021104005', name: 'Eswar Kumar', email: 'eswar@clg.edu', dept: 'MECH', year: 'IV', sec: 'A' }
  ];

  const studentPassHash = bcrypt.hashSync('student123', 10);
  const insertStudent = db.prepare(`
    INSERT OR IGNORE INTO students (register_number, name, email, department, year, section, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  sampleStudents.forEach(st => {
    insertStudent.run(st.reg, st.name, st.email, st.dept, st.year, st.sec, studentPassHash);
  });
  console.log('✅ Created 5 sample students (login: e.g. 910021104001 / student123)');

  // 3. Create a minimal valid PDF question paper for demonstration
  const papersDir = path.join(__dirname, 'storage', 'papers');
  if (!fs.existsSync(papersDir)) fs.mkdirSync(papersDir, { recursive: true });

  const samplePaperFilename = 'sample_cs8591_paper.pdf';
  const samplePaperPath = path.join(papersDir, samplePaperFilename);

  if (!fs.existsSync(samplePaperPath)) {
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 408 >> stream
BT
/F1 20 Tf
50 720 Td
(COLLEGE OF ENGINEERING & TECHNOLOGY) Tj
/F1 14 Tf
0 -30 Td
(DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING) Tj
0 -24 Td
(CS8591 - COMPUTER NETWORKS - SEMESTER EXAMINATION) Tj
/F1 12 Tf
0 -40 Td
(Time: 3 Hours) Tj
350 0 Td
(Maximum Marks: 100) Tj
-350 -40 Td
(PART A - Answer All Questions [10 x 2 = 20 Marks]) Tj
0 -25 Td
(1. What is the primary difference between OSI and TCP/IP reference models?) Tj
0 -25 Td
(2. Explain the purpose of Hamming distance in error detection.) Tj
0 -25 Td
(3. Define Piggybacking and its advantages in data communication.) Tj
0 -25 Td
(4. Distinguish between Distance Vector and Link State Routing Algorithms.) Tj
0 -25 Td
(5. What is the role of ARP and RARP protocols in IPv4 networks?) Tj
0 -40 Td
(PART B - Answer Either (a) or (b) [5 x 16 = 80 Marks]) Tj
0 -25 Td
(6. (a) Explain CSMA/CD protocol and how collision detection works in Ethernet.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000704 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
775
%%EOF`;

    fs.writeFileSync(samplePaperPath, minimalPdf, 'utf-8');
    console.log('✅ Generated sample question paper PDF: ' + samplePaperFilename);
  }

  // 4. Seed Active Sample Exam
  const existingExam = db.prepare('SELECT id FROM exams WHERE exam_code = ?').get('CS8591');
  if (!existingExam) {
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Started 10 mins ago
    const endTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // Ends in 3 hours

    db.prepare(`
      INSERT INTO exams (
        exam_code, title, subject, department, start_time, end_time,
        duration_minutes, max_violations, paper_filename, paper_original_name, instructions, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      'CS8591',
      'Computer Networks Semester Examination',
      'Computer Networks',
      'CSE',
      startTime,
      endTime,
      180,
      3,
      samplePaperFilename,
      'CS8591_Question_Paper_2026.pdf',
      '1. Fullscreen mode is mandatory throughout the examination.\n2. Tab switching or minimizing the window will trigger security violations.\n3. Exceeding 3 violations will automatically lock the exam session.\n4. Question papers are dynamically watermarked with your credentials to prevent malpractice.\n5. Answer on physical paper or submit answers per college guidelines.'
    );
    console.log('✅ Created active sample exam: "CS8591 - Computer Networks"');
  } else {
    console.log('ℹ️ Sample exam CS8591 already exists');
  }

  db.saveToDisk();
  console.log('🎉 Seeding completed successfully! Database saved to disk.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
