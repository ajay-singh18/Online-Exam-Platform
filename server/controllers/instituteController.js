const Institute = require('../models/Institute');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Batch = require('../models/Batch');
const Document = require('../models/Document');

/**
 * GET /api/institutes
 * SuperAdmin: list all institutes.
 */
const getInstitutes = async (req, res, next) => {
  try {
    const institutes = await Institute.find().sort({ createdAt: -1 });

    /* Attach user counts */
    const result = await Promise.all(
      institutes.map(async (inst) => {
        const adminCount = await User.countDocuments({ instituteId: inst._id, role: 'admin' });
        const studentCount = await User.countDocuments({ instituteId: inst._id, role: 'student' });
        return {
          ...inst.toObject(),
          adminCount,
          studentCount,
        };
      })
    );

    res.json({ success: true, institutes: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/institutes
 * SuperAdmin: create institute.
 */
const createInstitute = async (req, res, next) => {
  try {
    const { name, ownerEmail, plan, studentLimit, adminLimit } = req.body;

    const institute = await Institute.create({
      name,
      ownerEmail,
      plan,
      studentLimit,
      adminLimit,
    });

    res.status(201).json({ success: true, institute });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/institutes/:id
 * SuperAdmin: update institute plan/limits.
 */
const updateInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.json({ success: true, institute });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/institutes/:id
 * SuperAdmin: cascade delete institute completely.
 */
const deleteInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Cascade Delete
    await User.deleteMany({ instituteId: institute._id });
    
    const exams = await Exam.find({ instituteId: institute._id });
    const examIds = exams.map(e => e._id);
    
    await Attempt.deleteMany({ examId: { $in: examIds } });
    await Exam.deleteMany({ instituteId: institute._id });
    await Question.deleteMany({ instituteId: institute._id });
    await Batch.deleteMany({ instituteId: institute._id });
    await Document.deleteMany({ uploader: { $in: await User.find({ instituteId: institute._id }).select('_id') } }); // approximate, or just ignore Document if it lacks instituteId

    await Institute.findByIdAndDelete(institute._id);

    res.json({ success: true, message: 'Institute and all related data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInstitutes, createInstitute, updateInstitute, deleteInstitute };
