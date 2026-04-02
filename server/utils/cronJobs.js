const cron = require('node-cron');
const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { computeScore } = require('./scoring');

/**
 * Cron job: runs every minute.
 * Finds unsubmitted attempts where startedAt + durationMins has passed,
 * computes their score, and marks them as submitted.
 */
const startAutoSubmitCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      /* Find all attempts that haven't been submitted yet */
      const pendingAttempts = await Attempt.find({ submittedAt: null });

      for (const attempt of pendingAttempts) {
        const exam = await Exam.findById(attempt.examId);
        if (!exam) continue;

        const deadline = new Date(attempt.startedAt.getTime() + exam.durationMins * 60 * 1000);

        if (now >= deadline) {
          /* Time's up: auto-submit this attempt */
          const questions = await Question.find({ _id: { $in: exam.questions } });

          const { score, totalMarks, percentage } = computeScore(
            attempt.responses,
            questions,
            attempt.optionOrderMap
          );

          attempt.score = score;
          attempt.totalMarks = totalMarks;
          attempt.percentage = percentage;
          attempt.passed = percentage >= exam.passMark;
          attempt.submittedAt = now;

          await attempt.save();
          console.log(`[CRON] Auto-submitted attempt ${attempt._id} for user ${attempt.userId}`);
        }
      }
    } catch (error) {
      console.error('[CRON] Auto-submit error:', error.message);
    }
  });

  console.log('[CRON] Auto-submit job scheduled (every 1 minute)');
};

module.exports = { startAutoSubmitCron };
