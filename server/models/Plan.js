const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // e.g. "free", "starter", "pro" - this is the internal key for lookups
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required (0 for Free)'],
      default: 0,
    },
    studentLimit: {
      type: Number,
      required: true,
      default: 50,
    },
    adminLimit: {
      type: Number,
      required: true,
      default: 2,
    },
    features: {
      type: [String],
      default: [],
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    colorHint: {
      type: String,
      default: '#3b82f6', // For UI rendering
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
