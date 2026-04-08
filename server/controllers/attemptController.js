const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Batch = require('../models/Batch');
const { seededShuffle, generateSeed } = require('../utils/shuffle');
const { computeScore } = require('../utils/scoring');

/**
 * POST /api/attempts/start/:examId
 * Create Attempt doc, shuffle questions, return shuffled questions + serverTime.
 */
const startAttempt = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    /* Check if student is enrolled (individually, via batch, or enrollAll) */
    const inAllowed = exam.allowedStudents.some((id) => id.toString() === userId.toString());
    let inBatch = false;
    if (!inAllowed && exam.allowedBatches?.length > 0) {
      const match = await Batch.findOne({
        _id: { $in: exam.allowedBatches },
        students: userId,
      });
      inBatch = !!match;
    }
    const isEnrolled = exam.enrollAll || inAllowed || inBatch;
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this exam' });
    }

    /* Check exam window */
    const now = new Date();
    if (exam.startAt && now < exam.startAt) {
      return res.status(400).json({ message: 'Exam has not started yet' });
    }
    if (exam.endAt && now > exam.endAt) {
      return res.status(400).json({ message: 'Exam window has ended' });
    }

    /* Check if already submitted */
    const alreadySubmitted = await Attempt.findOne({ examId, userId, submittedAt: { $ne: null } });
    if (alreadySubmitted) {
      return res.status(400).json({ 
        message: 'You have already submitted this exam',
        submittedAt: alreadySubmitted.submittedAt
      });
    }

    /* Check for existing unsubmitted attempt */
    const existing = await Attempt.findOne({ examId, userId, submittedAt: null });
    if (existing) {
      /* Resume existing attempt — populate examId for client */
      await existing.populate('examId', 'title durationMins passMark');
      const remainingSeconds = Math.max(
        0,
        exam.durationMins * 60 - (Date.now() - existing.startedAt.getTime()) / 1000
      );

      const questions = await Question.find({ _id: { $in: existing.questionOrder } });
      /* Reorder questions according to stored order */
      const orderedQuestions = existing.questionOrder.map((qId) =>
        questions.find((q) => q._id.toString() === qId.toString())
      ).filter(Boolean);

      /* Strip correct answers from questions sent to client */
      const safeQuestions = orderedQuestions.map((q) => ({
        _id: q._id,
        text: q.text,
        type: q.type,
        options: q.options.map((opt) => ({ text: opt.text })),
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
      }));

      return res.json({
        success: true,
        attempt: existing,
        questions: safeQuestions,
        serverTime: Date.now(),
        remainingSeconds: Math.floor(remainingSeconds),
        resumed: true,
        aiProctoringEnabled: exam.aiProctoringEnabled || false,
      });
    }

    /* Generate seed and shuffle questions */
    const seed = generateSeed();
    let questionOrder = exam.questions.map((q) => q._id);
    const optionOrderMap = new Map();

    if (exam.randomizeQuestions) {
      const { shuffled } = seededShuffle(questionOrder, seed);
      questionOrder = shuffled;
    }

    /* Shuffle options per question if enabled */
    if (exam.randomizeOptions) {
      for (const q of exam.questions) {
        const optSeed = seed + parseInt(q._id.toString().slice(-6), 16);
        const indices = q.options.map((_, i) => i);
        const { order } = seededShuffle(indices, optSeed);
        optionOrderMap.set(q._id.toString(), order);
      }
    }

    /* Create attempt with server timestamp */
    const attempt = await Attempt.create({
      examId,
      userId,
      startedAt: now,
      seed,
      questionOrder,
      optionOrderMap,
      responses: [],
      violations: [],
    });

    /* Prepare questions for client (strip correct answers) */
    const orderedQuestions = questionOrder.map((qId) =>
      exam.questions.find((q) => q._id.toString() === qId.toString())
    ).filter(Boolean);

    const safeQuestions = orderedQuestions.map((q) => {
      let opts = q.options.map((opt) => ({ text: opt.text }));

      /* Apply option shuffling if enabled */
      const orderMap = optionOrderMap.get(q._id.toString());
      if (orderMap) {
        opts = orderMap.map((originalIdx) => ({ text: q.options[originalIdx].text }));
      }

      return {
        _id: q._id,
        text: q.text,
        type: q.type,
        options: opts,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
      };
    });

    res.status(201).json({
      success: true,
      attempt: {
        _id: attempt._id,
        examId: {
          _id: exam._id,
          title: exam.title,
          durationMins: exam.durationMins,
          passMark: exam.passMark,
        },
        startedAt: attempt.startedAt,
        responses: attempt.responses,
        violations: attempt.violations,
      },
      questions: safeQuestions,
      serverTime: Date.now(),
      remainingSeconds: exam.durationMins * 60,
      aiProctoringEnabled: exam.aiProctoringEnabled || false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/attempts/save/:attemptId
 * Autosave partial responses (called every 30s from client).
 */
const saveAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { responses, violations } = req.body;

    const attempt = await Attempt.findOne({
      _id: attemptId,
      userId: req.user._id,
      submittedAt: null,
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Active attempt not found' });
    }

    if (responses) attempt.responses = responses;
    if (violations && violations.length > 0) {
      attempt.violations.push(...violations);
    }

    await attempt.save();

    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/attempts/submit/:attemptId
 * Final submit: compute score, save violations.
 */
const submitAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { responses, violations } = req.body;

    const attempt = await Attempt.findOne({
      _id: attemptId,
      userId: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    /* Update with final responses */
    if (responses) attempt.responses = responses;
    if (violations && violations.length > 0) {
      attempt.violations.push(...violations);
    }

    /* Fetch exam and questions for scoring */
    const exam = await Exam.findById(attempt.examId);
    const questions = await Question.find({ _id: { $in: exam.questions } });

    const { score, totalMarks, percentage, perQuestion } = computeScore(
      attempt.responses,
      questions,
      attempt.optionOrderMap
    );

    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percentage = percentage;
    attempt.passed = percentage >= exam.passMark;
    attempt.submittedAt = new Date();

    await attempt.save();

    /* Create notification for admins */
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      const { getIo } = require('../utils/socket');

      // 1. Fetch all admins for this institute
      const admins = await User.find({ 
        instituteId: exam.instituteId, 
        role: { $in: ['admin', 'superAdmin'] } 
      });

      const notificationData = admins.map(admin => ({
        recipient: admin._id,
        actor: req.user._id,
        examId: exam._id,
        message: `${req.user.name} submitted their attempt for "${exam.title}"`,
        instituteId: exam.instituteId
      }));

      if (notificationData.length > 0) {
        await Notification.insertMany(notificationData);
        
        // 2. Broadcast via socket
        const io = getIo();
        const room = String(exam.instituteId);
        console.log(`[Notification] Emitting to room: ${room}`);
        io.to(room).emit('new_notification', {
          message: `${req.user.name} submitted "${exam.title}"`,
          studentName: req.user.name,
          examTitle: exam.title,
          attemptId: attempt._id
        });
      }
    } catch (notifErr) {
      console.error('Notification Error:', notifErr);
      // Don't fail the submission if notification fails
    }

    res.json({
      success: true,
      result: {
        score,
        totalMarks,
        percentage,
        passed: attempt.passed,
        violations: attempt.violations.length,
        perQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attempts/my
 * Student: own attempt history.
 */
const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('examId', 'title durationMins passMark')
      .sort({ createdAt: -1 });

    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attempts/exam/:examId
 * Admin: all attempts for an exam (with scores, violations).
 */
const getExamAttempts = async (req, res, next) => {
  try {
    const allAttempts = await Attempt.find({ examId: req.params.examId, submittedAt: { $ne: null } })
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    /* Deduplicate: keep only the BEST attempt per student (highest percentage) */
    const bestByUser = new Map();
    for (const a of allAttempts) {
      if (!a.userId) continue;
      const uid = a.userId._id.toString();
      const existing = bestByUser.get(uid);
      if (!existing || (a.percentage || 0) > (existing.percentage || 0)) {
        bestByUser.set(uid, a);
      }
    }
    const attempts = Array.from(bestByUser.values());

    const Batch = require('../models/Batch');
    for (let a of attempts) {
      if (a.userId && a.userId._id) {
        const batches = await Batch.find({ students: a.userId._id }).select('name').lean();
        a.userId.batchNames = batches.map(b => b.name).join(', ');
      }
    }

    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attempts/exam/:examId/missed
 * Admin: students enrolled but did NOT submit.
 */
const getMissedStudents = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const Batch = require('../models/Batch');
    const User = require('../models/User');

    /* Collect all enrolled student IDs */
    let enrolledIds = [...(exam.allowedStudents || []).map(id => id.toString())];

    /* Add students from allowed batches */
    if (exam.allowedBatches && exam.allowedBatches.length > 0) {
      const batches = await Batch.find({ _id: { $in: exam.allowedBatches } }).lean();
      for (const batch of batches) {
        for (const sid of batch.students) {
          enrolledIds.push(sid.toString());
        }
      }
    }

    /* If enrollAll, get all students in the institute */
    if (exam.enrollAll) {
      const allStudents = await User.find({ instituteId: exam.instituteId, role: 'student' }).select('_id').lean();
      enrolledIds = allStudents.map(s => s._id.toString());
    }

    /* Deduplicate */
    enrolledIds = [...new Set(enrolledIds)];

    /* Find all students who submitted */
    const submittedAttempts = await Attempt.find({ examId, submittedAt: { $ne: null } }).select('userId').lean();
    const submittedIds = new Set(submittedAttempts.map(a => a.userId.toString()));

    /* Missed = enrolled but not submitted */
    const missedIds = enrolledIds.filter(id => !submittedIds.has(id));

    /* Fetch user details + batch info */
    const missedStudents = await User.find({ _id: { $in: missedIds } }).select('name email').lean();

    for (const student of missedStudents) {
      const batches = await Batch.find({ students: student._id }).select('name').lean();
      student.batchNames = batches.map(b => b.name).join(', ');
    }

    res.json({ success: true, missed: missedStudents, totalEnrolled: enrolledIds.length, totalSubmitted: submittedIds.size });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attempts/:attemptId/result
 * Detailed result (student sees own only).
 */
const getAttemptResult = async (req, res, next) => {
  try {
    const query = { _id: req.params.attemptId };

    /* Students can only see their own results */
    if (req.user.role === 'student') {
      query.userId = req.user._id;
    }

    const attempt = await Attempt.findOne(query)
      .populate('examId', 'title durationMins passMark questions');

    if (!attempt) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ message: 'Exam not yet submitted' });
    }

    /* Fetch questions with correct answers for result display */
    const questions = await Question.find({
      _id: { $in: attempt.examId.questions },
    });

    /* Map to user's question order */
    const orderedQuestions = attempt.questionOrder.map((qId) =>
      questions.find((q) => q._id.toString() === qId.toString())
    ).filter(Boolean);

    /* Map options to the order the user saw them */
    const clientQuestions = orderedQuestions.map((q) => {
      let opts = q.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }));

      const orderMap = attempt.optionOrderMap?.get(q._id.toString());
      if (orderMap && orderMap.length > 0) {
        opts = orderMap.map((originalIdx) => opts[originalIdx]);
      }

      return {
        _id: q._id,
        text: q.text,
        type: q.type,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        options: opts,
      };
    });

    res.json({
      success: true,
      attempt,
      questions: clientQuestions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAttempt,
  saveAttempt,
  submitAttempt,
  getMyAttempts,
  getExamAttempts,
  getMissedStudents,
  getAttemptResult,
};

