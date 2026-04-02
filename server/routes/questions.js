const express = require('express');
const { getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImport, getTopics } = require('../controllers/questionController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin', 'superAdmin'));

router.get('/', getQuestions);
router.post('/', upload.single('image'), createQuestion);
router.get('/topics', getTopics);
router.put('/:id', upload.single('image'), updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/bulk-import', bulkImport);

module.exports = router;
