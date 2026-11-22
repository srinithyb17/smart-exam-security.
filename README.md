# 🛡️ Smart Exam Security Platform

> **High-Concurrency College Examination System with Real-Time Anti-Malpractice Telemetry, Protected PDF Streaming, and Dynamic Watermarking.**  
> Engineered to handle **1,000+ concurrent students** completely **free of cost**.

---

## 📑 Feature Specification Compliance

This application implements every requirement from the **Smart Exam Security** college specification across all 7 operational modules:

### 1. Admin Module
- **Secure Admin Login**: Role-based access control (RBAC) with bcrypt password hashing and JWT authentication.
- **Admin Dashboard**: Real-time summary cards (total enrolled, scheduled exams, active exams, active sessions, pending reset appeals, live security alerts ticker).
- **Student Management**: Add, edit, delete, and view candidate details with department/year filtering and instant search.
- **Bulk Student Upload**: High-speed CSV batch parser inserting hundreds of candidates in a single transaction with duplicate detection and password hashing.
- **Student Verification**: Register number and credential verification on server-side.
- **Exam Creation & Scheduling**: Subject name, exam code, scheduled start/end dates, duration in minutes, maximum allowed violation strikes, and instructions.
- **Question Paper Upload**: Direct PDF upload with secure storage outside public webroot.
- **Exam Activation**: Automated release at scheduled time with active window gating.
- **Exam Monitoring**: Real-time live invigilation room tracking all student statuses (`IN_PROGRESS`, `INTERRUPTED`, `LOCKED`, `SUBMITTED`), heartbeats, and client IP addresses.
- **Security Log Monitoring**: Searchable and filterable audit trail by exam, candidate, event type, and severity.
- **Session Reset Approval**: Dedicated approval desk for student appeals to authorize re-entry after an accidental interruption or lock.
- **Exam Reports**: Participation statistics, candidate submission audits, malpractice breakdowns, printable views, and one-click CSV export.

### 2. Student Module
- **Student Login**: Authenticate with register number and password.
- **Student Dashboard**: Categorized views for *Available Now (Active)*, *Upcoming (Scheduled)*, and *Completed (Submitted)* examinations.
- **Timed Question Paper Access**: Question paper unlocks exclusively at scheduled start time and locks immediately upon submission or time expiry.
- **Secure PDF Viewer**: Canvas-based PDF viewer powered by Mozilla's PDF.js without exposing standard browser download/print controls.
- **Fullscreen Exam Mode**: Forced fullscreen mode with automatic fullscreen exit alerts.
- **Countdown Timer**: Server-synchronized countdown clock with 5-minute warning alert and auto-submission when timer reaches `00:00:00`.
- **Session Status**: Instant feedback on session state (`Active`, `Interrupted`, `Locked`, `Submitted`).
- **Reset Request**: In-app appeal submission form when locked or interrupted.
- **Exam History**: Past exam submission verification and participation audit receipts.

### 3. Exam Session Security
- **One Authorized Session Per Exam**: Each student receives only one active session per exam.
- **Single-Session Enforcement**: Real-time token validation and heartbeat monitoring prevent unauthorized simultaneous logins.
- **Unauthorized Login Detection**: Detects and logs concurrent login attempts from another browser or device as a `CRITICAL` malpractice event.
- **Session Interruption Handling**: Browser closing or tab crashes trigger `navigator.sendBeacon` to log `INTERRUPTED`.
- **No Automatic Restart**: Locked sessions cannot be independently restarted by candidates.
- **Admin-Controlled Reset**: Only authorized administrators can reset or unlock an interrupted exam.
- **Session Expiry**: Server-side enforcement of exam conclusion.
- **Session Audit Trail**: Full lifecycle tracking: initialized, started, heartbeat, interrupted, reset requested, reset approved, submitted.

### 4. Malpractice Detection & Monitoring
- **Tab Switching Detection**: Listens to `visibilitychange` and `document.hidden`.
- **Window Focus Detection**: Detects `window.onblur` when student clicks outside exam window.
- **Fullscreen Exit Detection**: Triggers security violation when fullscreen is exited.
- **Anti-Screenshot & Blurred Mask**: Screen blurs completely whenever the exam window loses focus so background captures/screenshots only record blurred content.
- **Shortcut & DevTools Blocking**: Intercepts and blocks `PrintScreen` (with automatic clipboard clearing), `F12`, `Ctrl+Shift+I`, `Ctrl+C`, `Ctrl+V`, `Ctrl+P`, `Ctrl+S`, `Ctrl+U`, and right-click context menus.
- **Dynamic Watermark**: Real-time repeating diagonal watermark across every question paper page displaying candidate register number, exam code, student name, and a live updating timestamp to prevent mobile phone photography.
- **Automatic Lockout Threshold**: Configurable maximum violation strikes (default: 3). Exceeding the threshold automatically locks the session.

### 5. Question Paper Protection
- **Protected PDF Access**: Streaming endpoint `/api/exams/:id/paper` verifies active session, enrollment, and exam time window.
- **Zero Direct Public Link**: File is never served from a static URL.
- **Disable Download & Print**: Browser default download buttons omitted; rendered directly on HTML5 Canvas.
- **Secure Storage**: Kept in server-side storage with randomized UUID file names.

### 6. Security Logs & Reports
- Detailed timestamps and client IP addresses logged for every event.
- Severity classification: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Student-wise security history and exam-wise participation reports.
- Export to spreadsheet CSV and print-ready PDF styling.

### 7. Database & Account Security
- Ultra-high throughput in-memory SQLite architecture (WAL mode & debounced persistence).
- Bcrypt password hashing.
- Role-based route middleware.
- Immutable state transitions.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Sample Database
Seeds default admin, 5 sample students, sample active exam, and a sample question paper:
```bash
npm run seed
```

### 3. Build Client
```bash
npm run build
```

### 4. Start Server
```bash
npm run start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

---

## 🔑 Default Credentials

### Administrator Portal
- **Username**: `admin`
- **Password**: `admin123`

### Sample Student Accounts
- **Student 1**: `910021104001` / `student123`
- **Student 2**: `910021104002` / `student123`
- **Student 3**: `910021104003` / `student123`

*(A "Quick Test Credentials" helper is also available on the login page for 1-click testing).*

---

## 🧪 Running Automated Tests

Run the comprehensive 17-point automated integration test suite:
```bash
npm test
```

---

## 🌐 Free Hosting Guide (1,000+ Concurrent Students)

See [DEPLOYMENT.md](file:///c:/bbib/smart_exam/DEPLOYMENT.md) for complete step-by-step instructions to deploy completely free on:
1. **Render.com** (1-click Cloud Web Service)
2. **Oracle Cloud Always Free Tier** (4 OCPU, 24 GB RAM free forever — handles 5,000+ students)
3. **College Campus LAN / Intranet** (Zero external internet, < 1ms latency, 100% free forever)
4. **Docker & Docker Compose** (`docker-compose up -d`)
