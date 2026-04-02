const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDocuments, uploadDocument, deleteDocument } = require('../controllers/documentController');
const { verifyToken, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname.replace('.pdf', '');
    cb(null, `${originalName}-${Date.now()}.pdf`);
  }
});

const uploadLocal = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for documents'), false);
    }
  }
});

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin', 'superAdmin'));

router.route('/')
  .get(getDocuments)
  .post(uploadLocal.single('file'), uploadDocument);

router.route('/:id')
  .delete(deleteDocument);

module.exports = router;
