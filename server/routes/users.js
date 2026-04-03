const express = require('express');
const { getMe, updateMe, getUsers, updateUserStatus } = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/me', getMe);
router.put('/me', updateMe);

/* SuperAdmin only routes */
router.get('/', requireRole('superAdmin'), getUsers);
router.put('/:id/status', requireRole('superAdmin'), updateUserStatus);

module.exports = router;
