const express = require('express');
const { getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImport, getTopics, getSubjects, extractFromAI } = require('../controllers/questionController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin', 'superAdmin'));

router.get('/', getQuestions);
router.post('/', upload.single('image'), createQuestion);
router.get('/topics', getTopics);
router.get('/subjects', getSubjects);
router.put('/:id', upload.single('image'), updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/bulk-import', bulkImport);
router.post('/import/ai', upload.single('file'), extractFromAI);

module.exports = router;
