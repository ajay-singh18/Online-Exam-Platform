const express = require('express');
const { getInstitutes, createInstitute, updateInstitute, deleteInstitute } = require('../controllers/instituteController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('superAdmin'));

router.get('/', getInstitutes);
router.post('/', createInstitute);
router.put('/:id', updateInstitute);
router.delete('/:id', deleteInstitute);

module.exports = router;
