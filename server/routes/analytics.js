const express = require('express');
const { getExamSummary, getPlatformSummary } = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/exam/:examId/summary', requireRole('admin', 'superAdmin'), getExamSummary);
router.get('/platform', requireRole('superAdmin'), getPlatformSummary);

module.exports = router;
