const Institute = require('../models/Institute');

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for plan upgrade.
 */
const createOrder = async (req, res, next) => {
  try {
    const { plan } = req.body;

    /* Plan pricing (amounts in paise for INR) */
    const planPricing = {
      starter: 49900,   // ₹499
      pro: 149900,       // ₹1499
    };

    if (!planPricing[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
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
      amount: planPricing[plan],
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

    /* Upgrade institute plan */
    const planLimits = {
      starter: { studentLimit: 200, adminLimit: 5 },
      pro: { studentLimit: 1000, adminLimit: 20 },
    };

    const limits = planLimits[plan] || {};

    await Institute.findByIdAndUpdate(req.user.instituteId, {
      plan,
      razorpaySubscriptionId: razorpay_payment_id,
      ...limits,
    });

    res.json({
      success: true,
      message: `Plan upgraded to ${plan} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment };
