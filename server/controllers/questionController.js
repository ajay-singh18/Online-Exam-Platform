const Question = require('../models/Question');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * GET /api/questions
 * List questions with filters: topic, difficulty, type.
 */
const getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, type, page = 1, limit = 20 } = req.query;
    const filter = { instituteId: req.user.instituteId };

    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      questions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/questions
 * Create a question with optional image upload.
 */
const createQuestion = async (req, res, next) => {
  try {
    const { text, type, options, topic, difficulty } = req.body;

    let imageUrl = null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        console.warn('[CLOUDINARY] Upload failed:', uploadErr.message);
      }
    }

    const question = await Question.create({
      text,
      type,
      options: typeof options === 'string' ? JSON.parse(options) : options,
      topic,
      difficulty,
      imageUrl,
      createdBy: req.user._id,
      instituteId: req.user.instituteId,
    });

    res.status(201).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/questions/:id
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { text, type, options, topic, difficulty } = req.body;
    const question = await Question.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (text) question.text = text;
    if (type) question.type = type;
    if (options) question.options = typeof options === 'string' ? JSON.parse(options) : options;
    if (topic) question.topic = topic;
    if (difficulty) question.difficulty = difficulty;

    if (req.file) {
      try {
        question.imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        console.warn('[CLOUDINARY] Upload failed:', uploadErr.message);
      }
    }

    await question.save();
    res.json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/questions/:id
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/questions/bulk-import
 * Accept JSON array of questions.
 */
const bulkImport = async (req, res, next) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Provide an array of questions' });
    }

    const docs = questions.map((q) => ({
      ...q,
      createdBy: req.user._id,
      instituteId: req.user.instituteId,
    }));

    const result = await Question.insertMany(docs);
    res.status(201).json({ success: true, count: result.length, questions: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/questions/topics
 * Get a list of unique topics used in the institute's questions
 */
const getTopics = async (req, res, next) => {
  try {
    const topics = await Question.distinct('topic', { instituteId: req.user.instituteId });
    res.json({ success: true, topics: topics.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImport, getTopics };
