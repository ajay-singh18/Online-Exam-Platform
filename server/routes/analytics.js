const express = require('express');
const { getExamSummary } = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin', 'superAdmin'));

router.get('/exam/:examId/summary', getExamSummary);

module.exports = router;
