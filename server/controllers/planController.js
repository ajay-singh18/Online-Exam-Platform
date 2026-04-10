const Plan = require('../models/Plan');

/**
 * GET /api/plans
 * Public/Admin: Get all active plans sorted by price.
 */
const getActivePlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/plans/all
 * SuperAdmin: Get all plans regardless of active status.
 */
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/plans
 * SuperAdmin: Create a new plan.
 */
const createPlan = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Check if planId already exists
    const existing = await Plan.findOne({ planId: data.planId.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A plan with this internal ID already exists.' });
    }

    const plan = await Plan.create({
      ...data,
      planId: data.planId.toLowerCase().trim()
    });
    
    res.status(201).json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/plans/:id
 * SuperAdmin: Update an existing plan.
 */
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing the fundamental planId safely
    if (updateData.planId) {
      delete updateData.planId;
    }

    const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    res.json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/plans/:id
 * SuperAdmin: Delete a plan (hard delete).
 */
const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Prevent deleting "free" plan natively as fallback
    if (plan.planId === 'free') {
      return res.status(400).json({ message: 'Cannot delete the fundamental Free plan.' });
    }

    await Plan.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivePlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
};
