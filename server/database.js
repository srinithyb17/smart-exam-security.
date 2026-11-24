const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const bundledDbPath = path.join(__dirname, 'smart_exam.db');
const dbPath = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/smart_exam.db' : bundledDbPath);

let rawDb = null;
let saveTimeout = null;

// Debounced persistence to disk for ultra-high throughput
function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveToDisk();
    saveTimeout = null;
  }, 300);
}

function saveToDisk() {
  try {
    if (!rawDb) return;
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

// Flush synchronously on shutdown
process.on('SIGINT', () => {
  saveToDisk();
  process.exit(0);
});
process.on('SIGTERM', () => {
  saveToDisk();
  process.exit(0);
});

// Normalized Statement Wrapper matching better-sqlite3 API
class StatementWrapper {
  constructor(sql) {
    this.sql = sql;
  }

  normalizeParams(params) {
    if (params.length === 1 && Array.isArray(params[0])) {
      return params[0];
    }
    return params;
  }

  get(...params) {
    const flatParams = this.normalizeParams(params);
    const stmt = rawDb.prepare(this.sql);
    try {
      if (flatParams.length > 0) {
        stmt.bind(flatParams);
      }
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params) {
    const flatParams = this.normalizeParams(params);
    const stmt = rawDb.prepare(this.sql);
    const rows = [];
    try {
      if (flatParams.length > 0) {
        stmt.bind(flatParams);
      }
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  run(...params) {
    const flatParams = this.normalizeParams(params);
    rawDb.run(this.sql, flatParams);
    scheduleSave();
    
    // Get last insert ID if needed
    let lastInsertRowid = 0;
    try {
      const res = rawDb.exec('SELECT last_insert_rowid() as id');
      if (res && res[0] && res[0].values && res[0].values[0]) {
        lastInsertRowid = res[0].values[0][0];
      }
    } catch (_) {}

    return {
      changes: rawDb.getRowsModified(),
      lastInsertRowid
    };
  }
}

const db = {
  prepare(sql) {
    return new StatementWrapper(sql);
  },

  exec(sql) {
    rawDb.run(sql);
    scheduleSave();
  },

  transaction(fn) {
    return (...args) => {
      rawDb.run('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.run('COMMIT;');
        scheduleSave();
        return result;
      } catch (err) {
        rawDb.run('ROLLBACK;');
        throw err;
      }
    };
  },

  saveToDisk,

  async init() {
    if (rawDb) return rawDb;

    const SQL = await initSqlJs({
      locateFile: file => {
        const localServer = path.join(__dirname, file);
        if (fs.existsSync(localServer)) return localServer;
        const localApi = path.join(__dirname, '..', 'api', file);
        if (fs.existsSync(localApi)) return localApi;
        try {
          return path.join(path.dirname(require.resolve('sql.js')), file);
        } catch (_) {
          return path.join(__dirname, 'node_modules', 'sql.js', 'dist', file);
        }
      }
    });

    if (process.env.VERCEL && !fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, dbPath);
      } catch (_) {}
    }

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
    } else if (fs.existsSync(bundledDbPath)) {
      const fileBuffer = fs.readFileSync(bundledDbPath);
      rawDb = new SQL.Database(fileBuffer);
    } else {
      rawDb = new SQL.Database();
    }

    // Initialize Schema
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        register_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        department TEXT,
        year TEXT,
        section TEXT,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        department TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        max_violations INTEGER DEFAULT 3,
        paper_filename TEXT,
        paper_original_name TEXT,
        instructions TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exam_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        session_token TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'NOT_STARTED',
        start_time TEXT,
        end_time TEXT,
        last_heartbeat TEXT,
        ip_address TEXT,
        user_agent TEXT,
        violations_count INTEGER DEFAULT 0,
        reset_status TEXT DEFAULT 'NONE',
        reset_reason TEXT,
        reset_requested_at TEXT,
        reset_reviewed_at TEXT,
        reset_reviewed_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exam_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        exam_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'MEDIUM',
        details TEXT,
        ip_address TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_students_reg ON students(register_number);
      CREATE INDEX IF NOT EXISTS idx_sessions_student_exam ON exam_sessions(student_id, exam_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON exam_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_security_exam ON security_logs(exam_id, timestamp);
    `);

    // Ensure storage folders exist
    try {
      const papersDir = process.env.VERCEL ? '/tmp/storage/papers' : path.join(__dirname, 'storage', 'papers');
      const uploadsDir = process.env.VERCEL ? '/tmp/storage/uploads' : path.join(__dirname, 'storage', 'uploads');
      if (!fs.existsSync(papersDir)) fs.mkdirSync(papersDir, { recursive: true });
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (_) {}

    // Ensure default admin, students, and sample exam exist
    try {
      const bcrypt = require('bcryptjs');
      const adminRes = rawDb.exec('SELECT count(*) FROM admins');
      const adminCount = (adminRes && adminRes[0] && adminRes[0].values && adminRes[0].values[0]) ? adminRes[0].values[0][0] : 0;
      if (adminCount === 0) {
        const adminPass = bcrypt.hashSync('admin123', 10);
        rawDb.run(
          'INSERT INTO admins (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)',
          ['admin', adminPass, 'Chief Examination Officer', 'examcell@college.edu', 'admin']
        );
      }

      const studentRes = rawDb.exec('SELECT count(*) FROM students');
      const studentCount = (studentRes && studentRes[0] && studentRes[0].values && studentRes[0].values[0]) ? studentRes[0].values[0][0] : 0;
      if (studentCount === 0) {
        const studentPass = bcrypt.hashSync('student123', 10);
        const sampleStudents = [
          ['910021104001', 'Aarav Sharma', 'aarav@clg.edu', 'CSE', 'IV', 'A', studentPass],
          ['910021104002', 'Bhavya Patel', 'bhavya@clg.edu', 'CSE', 'IV', 'A', studentPass],
          ['910021104003', 'Chirag Reddy', 'chirag@clg.edu', 'ECE', 'IV', 'B', studentPass]
        ];
        sampleStudents.forEach(st => {
          rawDb.run(
            'INSERT OR IGNORE INTO students (register_number, name, email, department, year, section, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
            st
          );
        });
      }

      const examRes = rawDb.exec('SELECT count(*) FROM exams');
      const examCount = (examRes && examRes[0] && examRes[0].values && examRes[0].values[0]) ? examRes[0].values[0][0] : 0;
      if (examCount === 0) {
        const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        rawDb.run(`
          INSERT INTO exams (
            exam_code, title, subject, department, start_time, end_time,
            duration_minutes, max_violations, paper_filename, paper_original_name, instructions, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          'CS8591',
          'Computer Networks Semester Examination',
          'Computer Networks',
          'CSE',
          startTime,
          endTime,
          180,
          3,
          'sample_cs8591_paper.pdf',
          'CS8591_Question_Paper_2026.pdf',
          '1. Fullscreen mode is mandatory throughout the examination.\n2. Exceeding 3 violations will automatically lock the exam session.'
        ]);
      }
    } catch (e) {
      console.warn('Auto-seed notice:', e.message);
    }

    saveToDisk();
    return rawDb;
  }
};

module.exports = db;
