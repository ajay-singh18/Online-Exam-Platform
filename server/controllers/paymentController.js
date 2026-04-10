const Institute = require('../models/Institute');
const User = require('../models/User');

const Plan = require('../models/Plan');

/**
 * GET /api/payments/status
 * Return the current institute's plan, usage, and limits.
 */
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.user.instituteId).lean();
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    const studentCount = await User.countDocuments({ instituteId: institute._id, role: 'student' });
    const adminCount = await User.countDocuments({ instituteId: institute._id, role: 'admin' });

    res.json({
      success: true,
      plan: institute.plan || 'free',
      studentLimit: institute.studentLimit,
      adminLimit: institute.adminLimit,
      studentCount,
      adminCount,
      instituteName: institute.name,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for plan upgrade.
 */
const createOrder = async (req, res, next) => {
  try {
    const { plan } = req.body;

    const dbPlan = await Plan.findOne({ planId: plan, isActive: true });
    
    if (!dbPlan || plan === 'free') {
      return res.status(400).json({ message: 'Invalid or inactive plan selected' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: (dbPlan.price * 100), // converting ₹ to paise

      currency: 'INR',
      receipt: `plan_${plan}_${Date.now()}`,
      notes: {
        plan,
        instituteId: req.user.instituteId?.toString(),
      },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and upgrade plan.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const dbPlan = await Plan.findOne({ planId: plan });
    if (!dbPlan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    await Institute.findByIdAndUpdate(req.user.instituteId, {
      plan,
      studentLimit: dbPlan.studentLimit,
      adminLimit: dbPlan.adminLimit,
      razorpaySubscriptionId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: `Plan upgraded to ${plan} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/* ── Team Management ──────────────────────────────── */

/**
 * GET /api/payments/team
 * List all admins in the same institute.
 */
const getTeamMembers = async (req, res, next) => {
  try {
    const admins = await User.find({ instituteId: req.user.instituteId, role: 'admin' })
      .select('name email createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const institute = await Institute.findById(req.user.instituteId).select('ownerEmail adminLimit plan').lean();

    res.json({
      success: true,
      members: admins.map(a => ({
        ...a,
        isOwner: a.email === institute?.ownerEmail,
      })),
      adminLimit: institute?.adminLimit || 2,
      plan: institute?.plan || 'free',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/team/invite
 * Invite a new admin to the institute.
 */
const inviteAdmin = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    /* Check ownership: only institute owner can invite */
    const institute = await Institute.findById(req.user.instituteId).lean();
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    const caller = await User.findById(req.user._id).lean();
    if (caller.email !== institute.ownerEmail) {
      return res.status(403).json({ message: 'Only the institute owner can invite admins' });
    }

    /* Check admin limit */
    const currentAdminCount = await User.countDocuments({ instituteId: institute._id, role: 'admin' });
    if (currentAdminCount >= institute.adminLimit) {
      return res.status(403).json({
        message: `Admin limit reached (${institute.adminLimit}). Upgrade your plan to add more admins.`,
      });
    }

    /* Check if email already exists */
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered' });
    }

    /* Create the admin user */
    const admin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'admin',
      instituteId: institute._id,
      isVerified: true,  // owner-invited admins are auto-verified
    });

    res.status(201).json({
      success: true,
      message: `Admin ${name} invited successfully`,
      member: { _id: admin._id, name: admin.name, email: admin.email, isOwner: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/payments/team/:userId
 * Remove an admin from the institute.
 */
const removeAdmin = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.user.instituteId).lean();
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    const caller = await User.findById(req.user._id).lean();
    if (caller.email !== institute.ownerEmail) {
      return res.status(403).json({ message: 'Only the institute owner can remove admins' });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.email === institute.ownerEmail) {
      return res.status(400).json({ message: 'Cannot remove the institute owner' });
    }

    if (target.instituteId?.toString() !== institute._id.toString()) {
      return res.status(400).json({ message: 'User does not belong to this institute' });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({ success: true, message: 'Admin removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubscriptionStatus, createOrder, verifyPayment, getTeamMembers, inviteAdmin, removeAdmin };
