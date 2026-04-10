const Plan = require('../models/Plan');

const seedPlans = async () => {
  try {
    const count = await Plan.countDocuments();
    if (count === 0) {
      await Plan.insertMany([
        {
          planId: 'free',
          name: 'Free',
          price: 0,
          studentLimit: 50,
          adminLimit: 2,
          features: ['50 Students', '2 Admins', 'All Proctoring Features', 'Basic Analytics', 'Email Support'],
          isRecommended: false,
          colorHint: '#64748b'
        },
        {
          planId: 'starter',
          name: 'Starter',
          price: 499,
          studentLimit: 500,
          adminLimit: 10,
          features: ['500 Students', '10 Admins', 'All Proctoring Features', 'Advanced Analytics', 'Report Cards', 'Priority Support'],
          isRecommended: true,
          colorHint: '#3b82f6'
        },
        {
          planId: 'pro',
          name: 'Pro',
          price: 999,
          studentLimit: 10000,
          adminLimit: 50,
          features: ['Unlimited Students', 'Unlimited Admins', 'All Proctoring Features', 'Full Analytics Suite', 'Report Cards', 'Team Management', 'Dedicated Support'],
          isRecommended: false,
          colorHint: '#8b5cf6'
        }
      ]);
      console.log('🌱 Seeded default subscription plans');
    }
  } catch (error) {
    console.error('Error seeding plans:', error);
  }
};

module.exports = { seedPlans };
