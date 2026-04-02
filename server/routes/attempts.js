const express = require('express');
const {
  startAttempt,
  saveAttempt,
  submitAttempt,
  getMyAttempts,
  getExamAttempts,
  getAttemptResult,
} = require('../controllers/attemptController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/start/:examId', startAttempt);
router.put('/save/:attemptId', saveAttempt);
router.post('/submit/:attemptId', submitAttempt);
router.get('/my', getMyAttempts);
router.get('/exam/:examId', requireRole('admin', 'superAdmin'), getExamAttempts);
router.get('/:attemptId/result', getAttemptResult);

module.exports = router;
