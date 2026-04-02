const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    durationMins: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    startAt: Date,
    endAt: Date,
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeOptions: {
      type: Boolean,
      default: false,
    },
    fullscreenRequired: {
      type: Boolean,
      default: false,
    },
    passMark: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    enrollAll: {
      type: Boolean,
      default: false,
    },
    allowedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    allowedBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
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

module.exports = mongoose.model('Exam', examSchema);
