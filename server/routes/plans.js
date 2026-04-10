const express = require('express');
const {
  getActivePlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

/* Public/Admin: Get active plans for Pricing page */
router.get('/', getActivePlans);

/* SuperAdmin ONLY */
router.get('/all', requireRole('superAdmin'), getAllPlans);
router.post('/', requireRole('superAdmin'), createPlan);
router.put('/:id', requireRole('superAdmin'), updatePlan);
router.delete('/:id', requireRole('superAdmin'), deletePlan);

module.exports = router;
