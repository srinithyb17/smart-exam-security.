const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'smart_exam.db');

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
      locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
    });

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
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
    const papersDir = path.join(__dirname, 'storage', 'papers');
    const uploadsDir = path.join(__dirname, 'storage', 'uploads');
    if (!fs.existsSync(papersDir)) fs.mkdirSync(papersDir, { recursive: true });
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    saveToDisk();
    return rawDb;
  }
};

module.exports = db;
