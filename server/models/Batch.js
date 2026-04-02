const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);
