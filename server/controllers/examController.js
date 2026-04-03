const Exam = require('../models/Exam');
const User = require('../models/User');
const Batch = require('../models/Batch');

/**
 * GET /api/exams
 * Admin: all exams in institute. Student: enrolled exams only.
 */
const getExams = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { instituteId: req.user.instituteId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let exams;

    if (req.user.role === 'admin' || req.user.role === 'superAdmin') {
      exams = await Exam.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });
    } else {
      /* Student: exams they're enrolled in, via batch, or open to all */
      const studentBatches = await Batch.find(
        { students: req.user._id, instituteId: req.user.instituteId },
        '_id'
      ).lean();
      const batchIds = studentBatches.map((b) => b._id);

      const studentQuery = {
        ...query,
        $or: [
          ...(query.$or || []),
          { allowedStudents: req.user._id },
          { allowedBatches: { $in: batchIds } },
          { enrollAll: true },
        ],
      };

      const rawExams = await Exam.find(studentQuery)
        .sort({ startAt: -1 })
        .lean();
      /* Strip question IDs but keep count */
      exams = rawExams.map((e) => {
        const { questions, ...rest } = e;
        return { ...rest, questionCount: questions ? questions.length : 0 };
      });
    }

    res.json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/exams/:id
 * Get a single exam. Admin: full details. Student: with questionCount (IDs stripped).
 */
const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    /* Students: verify enrollment (individual, batch, or enrollAll) and strip question IDs */
    if (req.user.role === 'student') {
      const inAllowed = exam.allowedStudents.some((id) => id.toString() === req.user._id.toString());
      let inBatch = false;
      if (!inAllowed && exam.allowedBatches?.length > 0) {
        const match = await Batch.findOne({
          _id: { $in: exam.allowedBatches },
          students: req.user._id,
        });
        inBatch = !!match;
      }
      const isEnrolled = exam.enrollAll || inAllowed || inBatch;
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You are not enrolled in this exam' });
      }
      const { questions, ...rest } = exam;
      return res.json({ success: true, exam: { ...rest, questionCount: questions ? questions.length : 0 } });
    }

    res.json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/exams
 * Create exam [admin].
 */
const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      durationMins,
      startAt,
      endAt,
      questions,
      randomizeQuestions,
      randomizeOptions,
      fullscreenRequired,
      passMark,
      enrollAll,
      allowedBatches,
    } = req.body;

    const exam = await Exam.create({
      title,
      description,
      durationMins,
      startAt,
      endAt,
      questions,
      randomizeQuestions,
      randomizeOptions,
      fullscreenRequired,
      passMark,
      enrollAll,
      allowedBatches: allowedBatches || [],
      instituteId: req.user.instituteId,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/exams/:id [admin]
 */
const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/exams/:id [admin]
 */
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/exams/:id/enrol
 * List enrolled students [admin].
 */
const getEnrolledStudents = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate(
      'allowedStudents',
      'name email'
    );

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ success: true, students: exam.allowedStudents });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/exams/:id/enrol
 * Enrol student(s) by email or userId [admin].
 */
const enrolStudents = async (req, res, next) => {
  try {
    const { emails, userIds } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const studentsToAdd = [];

    /* Find by emails */
    if (emails && emails.length > 0) {
      const users = await User.find({
        email: { $in: emails },
        role: 'student',
        instituteId: req.user.instituteId,
      });
      studentsToAdd.push(...users.map((u) => u._id));
    }

    /* Add by userIds */
    if (userIds && userIds.length > 0) {
      studentsToAdd.push(...userIds);
    }

    /* Add unique students (avoid duplicates) */
    const existingIds = exam.allowedStudents.map((id) => id.toString());
    const newIds = studentsToAdd.filter(
      (id) => !existingIds.includes(id.toString())
    );

    exam.allowedStudents.push(...newIds);
    await exam.save();

    res.json({
      success: true,
      message: `${newIds.length} student(s) enrolled`,
      totalEnrolled: exam.allowedStudents.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getEnrolledStudents,
  enrolStudents,
};
