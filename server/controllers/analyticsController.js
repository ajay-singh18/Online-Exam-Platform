const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Institute = require('../models/Institute');

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
          highestScore: 0,
          scoreDistribution: [],
          questionAccuracy: [],
          timePerQuestion: [],
          flaggedAttemptsCount: 0,
          violationSummary: [],
          topicPerformance: [],
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
    const questionAccuracy = questions.map((q, idx) => {
      let correct = 0;
      let total = attempts.length;

      attempts.forEach((attempt) => {
        const resp = attempt.responses.find(
          (r) => r.questionId?.toString() === q._id.toString()
        );
        if (resp && resp.selectedOptions.length > 0) {
          const correctIndices = q.options
            .map((opt, idx) => (opt.isCorrect ? idx : -1))
            .filter((i) => i !== -1);

          let isCorrect = false;
          if (q.type === 'msq') {
            const sorted1 = [...resp.selectedOptions].sort();
            const sorted2 = [...correctIndices].sort();
            isCorrect =
              sorted1.length === sorted2.length &&
              sorted1.every((v, i) => v === sorted2[i]);
          } else {
            // MCQ, True/False, FillBlank (single choice for now)
            isCorrect = correctIndices.includes(resp.selectedOptions[0]);
          }

          if (isCorrect) correct++;
        }
      });

      return {
        questionId: q._id,
        label: `Q${idx + 1}`,
        topic: q.topic,
        difficulty: q.difficulty,
        text: (q.text || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 80),
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        attempted: total,
      };
    });

    /* Average time per question */
    const timePerQuestion = questions.map((q, idx) => {
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
        label: `Q${idx + 1}`,
        topic: q.topic,
        avgTime: count > 0 ? Math.round(totalTime / count) : 0,
      };
    });

    const highestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage || 0)) : 0;

    /* Proctoring Analytics */
    let flaggedAttemptsCount = 0;
    const violationSummaryData = {};

    attempts.forEach(attempt => {
      if (attempt.violations && attempt.violations.length > 0) {
        flaggedAttemptsCount++;
        attempt.violations.forEach(v => {
          if (v.type) {
            violationSummaryData[v.type] = (violationSummaryData[v.type] || 0) + 1;
          }
        });
      }
    });

    const violationSummary = Object.keys(violationSummaryData).map(key => ({
      type: key,
      count: violationSummaryData[key],
    }));

    /* Topic Performance */
    const topicPerformanceData = {};
    questionAccuracy.forEach(qa => {
      if (!topicPerformanceData[qa.topic]) {
        topicPerformanceData[qa.topic] = { totalAccuracy: 0, count: 0 };
      }
      topicPerformanceData[qa.topic].totalAccuracy += qa.accuracy;
      topicPerformanceData[qa.topic].count++;
    });

    const topicPerformance = Object.keys(topicPerformanceData).map(topic => ({
      topic: topic || 'Uncategorized',
      accuracy: Math.round(topicPerformanceData[topic].totalAccuracy / topicPerformanceData[topic].count),
    }));

    res.json({
      success: true,
      summary: {
        totalAttempts: attempts.length,
        avgScore,
        avgPercentage,
        passRate,
        highestScore,
        scoreDistribution: scoreDistributionFormatted,
        questionAccuracy,
        timePerQuestion,
        flaggedAttemptsCount,
        violationSummary,
        topicPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/platform
 * SuperAdmin: Global platform statistics.
 */
const getPlatformSummary = async (req, res, next) => {
  try {
    const totalInstitutes = await Institute.countDocuments();
    
    // Using aggregation to group by plan
    const institutesByPlan = await Institute.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } }
    ]);
    // format it
    const planDistribution = institutesByPlan.map(ip => ({
      plan: ip._id || 'Free',
      count: ip.count
    }));

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'superAdmin'] } });

    const totalExams = await Exam.countDocuments();
    const totalAttempts = await Attempt.countDocuments({ submittedAt: { $ne: null } });
    
    // Quick attempt flagging calculation for global metric
    const attemptsWithViolations = await Attempt.countDocuments({ 
      submittedAt: { $ne: null },
      'violations.0': { $exists: true }
    });

    const flaggedRate = totalAttempts > 0 
      ? Math.round((attemptsWithViolations / totalAttempts) * 100)
      : 0;

    res.json({
      success: true,
      platform: {
        totalInstitutes,
        totalStudents,
        totalAdmins,
        totalExams,
        totalAttempts,
        flaggedRate,
        planDistribution
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getExamSummary, getPlatformSummary };
