const express = require('express');
const {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
} = require('../controllers/batchController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin', 'superAdmin'));

router.get('/', getBatches);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);
router.post('/:id/students', addStudentsToBatch);
router.delete('/:id/students/:studentId', removeStudentFromBatch);

module.exports = router;
