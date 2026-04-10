const express = require('express');
const {
  getSubscriptionStatus,
  createOrder,
  verifyPayment,
  getTeamMembers,
  inviteAdmin,
  removeAdmin,
} = require('../controllers/paymentController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

/* Plan info & billing */
router.get('/status', requireRole('admin'), getSubscriptionStatus);
router.post('/create-order', requireRole('admin'), createOrder);
router.post('/verify', requireRole('admin'), verifyPayment);

/* Team management */
router.get('/team', requireRole('admin'), getTeamMembers);
router.post('/team/invite', requireRole('admin'), inviteAdmin);
router.delete('/team/:userId', requireRole('admin'), removeAdmin);

module.exports = router;
