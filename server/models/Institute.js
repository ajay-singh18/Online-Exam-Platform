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
      default: 'free',
    },
    studentLimit: {
      type: Number,
    },
    adminLimit: {
      type: Number,
    },
    razorpaySubscriptionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institute', instituteSchema);
