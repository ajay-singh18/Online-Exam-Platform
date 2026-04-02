const express = require('express');
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getEnrolledStudents,
  enrolStudents,
} = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/', requireRole('admin', 'superAdmin'), createExam);
router.put('/:id', requireRole('admin', 'superAdmin'), updateExam);
router.delete('/:id', requireRole('admin', 'superAdmin'), deleteExam);
router.get('/:id/enrol', requireRole('admin', 'superAdmin'), getEnrolledStudents);
router.post('/:id/enrol', requireRole('admin', 'superAdmin'), enrolStudents);

module.exports = router;
