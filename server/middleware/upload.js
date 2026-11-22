const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Storage for Question Paper PDFs (Stored securely outside public access)
const paperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'storage', 'papers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `paper_${uuidv4()}${ext}`);
  }
});

const paperFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for question papers!'), false);
  }
};

const uploadPaper = multer({
  storage: paperStorage,
  fileFilter: paperFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB max
});

// Storage for CSV student bulk upload
const uploadCsvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'storage', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `students_${uuidv4()}_${Date.now()}.csv`);
  }
});

const uploadCsv = multer({
  storage: uploadCsvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  uploadPaper,
  uploadCsv
};
