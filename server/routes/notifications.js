const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    clearAllNotifications
} = require('../controllers/notificationController');

router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/', clearAllNotifications);

module.exports = router;
