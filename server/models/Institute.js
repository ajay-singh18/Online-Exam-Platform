const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institute name is required'],
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro'],
      default: 'free',
    },
    studentLimit: {
      type: Number,
      default: 50,
    },
    adminLimit: {
      type: Number,
      default: 2,
    },
    razorpaySubscriptionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institute', instituteSchema);
