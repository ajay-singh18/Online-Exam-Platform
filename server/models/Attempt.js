const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    responses: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedOptions: [Number],
        timeSpentSecs: { type: Number, default: 0 },
      },
    ],
    violations: [
      {
        type: {
          type: String,
          enum: ['tabSwitch', 'fullscreenExit', 'copyPaste'],
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    score: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    percentage: { type: Number, default: null },
    passed: { type: Boolean, default: null },
    submittedAt: Date,
    /* Randomization state: stored per-attempt for deterministic replay */
    seed: Number,
    questionOrder: [mongoose.Schema.Types.ObjectId],
    optionOrderMap: {
      type: Map,
      of: [Number],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attempt', attemptSchema);
