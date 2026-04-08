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
          /* Check if student already has a submitted attempt for this exam */
          const alreadySubmitted = await Attempt.findOne({
            examId: attempt.examId,
            userId: attempt.userId,
            submittedAt: { $ne: null }
          });

          if (alreadySubmitted) {
            /* Student already submitted — delete this orphan attempt */
            await Attempt.deleteOne({ _id: attempt._id });
            console.log(`[CRON] Deleted orphan attempt ${attempt._id} for user ${attempt.userId} (already submitted)`);
            continue;
          }

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
