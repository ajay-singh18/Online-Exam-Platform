const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

/**
 * GET /api/analytics/exam/:examId/summary
 * Aggregated analytics: avg score, pass rate, per-question accuracy, time distribution.
 */
const getExamSummary = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempts = await Attempt.find({ examId, submittedAt: { $ne: null } });
    const questions = await Question.find({ _id: { $in: exam.questions } });

    if (attempts.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalAttempts: 0,
          avgScore: 0,
          avgPercentage: 0,
          passRate: 0,
          scoreDistribution: [],
          perQuestionAccuracy: [],
          avgTimePerQuestion: [],
        },
      });
    }

    /* Average score and percentage */
    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalPercentage = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
    const avgScore = Math.round((totalScore / attempts.length) * 100) / 100;
    const avgPercentage = Math.round(totalPercentage / attempts.length);

    /* Pass rate */
    const passCount = attempts.filter((a) => a.passed).length;
    const passRate = Math.round((passCount / attempts.length) * 100);

    /* Score distribution (histogram buckets: 0-10, 10-20, ..., 90-100) */
    const scoreDistribution = Array(10).fill(0);
    attempts.forEach((a) => {
      const bucket = Math.min(9, Math.floor((a.percentage || 0) / 10));
      scoreDistribution[bucket]++;
    });

    const scoreDistributionFormatted = scoreDistribution.map((count, idx) => ({
      range: `${idx * 10}-${idx * 10 + 10}%`,
      count,
    }));

    /* Per-question accuracy */
    const questionAccuracy = questions.map((q) => {
      let correct = 0;
      let total = 0;

      attempts.forEach((attempt) => {
        const resp = attempt.responses.find(
          (r) => r.questionId?.toString() === q._id.toString()
        );
        if (resp && resp.selectedOptions.length > 0) {
          total++;
          const correctIndices = q.options
            .map((opt, idx) => (opt.isCorrect ? idx : -1))
            .filter((i) => i !== -1);

          /* For simplicity, check if any selected option matches */
          let isCorrect = false;
          if (q.type === 'mcq' || q.type === 'truefalse') {
            isCorrect = correctIndices.includes(resp.selectedOptions[0]);
          } else if (q.type === 'msq') {
            const sorted1 = [...resp.selectedOptions].sort();
            const sorted2 = [...correctIndices].sort();
            isCorrect =
              sorted1.length === sorted2.length &&
              sorted1.every((v, i) => v === sorted2[i]);
          }

          if (isCorrect) correct++;
        }
      });

      return {
        questionId: q._id,
        topic: q.topic,
        difficulty: q.difficulty,
        text: q.text.substring(0, 80),
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        attempted: total,
      };
    });

    /* Average time per question */
    const avgTimePerQuestion = questions.map((q) => {
      let totalTime = 0;
      let count = 0;

      attempts.forEach((attempt) => {
        const resp = attempt.responses.find(
          (r) => r.questionId?.toString() === q._id.toString()
        );
        if (resp && resp.timeSpentSecs > 0) {
          totalTime += resp.timeSpentSecs;
          count++;
        }
      });

      return {
        questionId: q._id,
        topic: q.topic,
        avgTimeSecs: count > 0 ? Math.round(totalTime / count) : 0,
      };
    });

    const highestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage || 0)) : 0;

    res.json({
      success: true,
      summary: {
        totalAttempts: attempts.length,
        avgScore,
        avgPercentage,
        passRate,
        highestScore,
        scoreDistribution: scoreDistributionFormatted,
        perQuestionAccuracy: questionAccuracy,
        avgTimePerQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExamSummary };
