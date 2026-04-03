const Question = require('../models/Question');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { extractQuestionsFromText } = require('../utils/gemini');
const pdf = require('pdf-parse');

/**
 * GET /api/questions
 * List questions with filters: topic, difficulty, type.
 */
const getQuestions = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, type, search, page = 1, limit = 20 } = req.query;
    const filter = { instituteId: req.user.instituteId };

    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { 'options.text': { $regex: search, $options: 'i' } },
      ];
    }

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
    const { text, type, options, subject, topic, difficulty } = req.body;

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
      subject: subject || 'General',
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
    const { text, type, options, subject, topic, difficulty } = req.body;
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
    if (subject) question.subject = subject;
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

/**
 * GET /api/questions/subjects
 * Get a list of unique subjects used in the institute's questions
 */
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Question.distinct('subject', { instituteId: req.user.instituteId });
    res.json({ success: true, subjects: subjects.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/questions/import/ai
 * Extract questions from PDF or JSON using Gemini.
 */
const extractFromAI = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let text = '';
    const mimetype = req.file.mimetype;

    if (mimetype === 'application/pdf') {
       const data = await pdf(req.file.buffer);
       text = data.text;
    } else {
       text = req.file.buffer.toString('utf-8');
    }

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ message: 'File contains too little text to extract questions.' });
    }

    const questions = await extractQuestionsFromText(text);

    res.json({
      success: true,
      questions,
      message: `Extracted ${questions.length} questions. Please review them.`
    });

  } catch (error) {
    console.error('[AI_IMPORT] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'AI extraction failed. Make sure the PDF has selectable text.' 
    });
  }
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImport, getTopics, getSubjects, extractFromAI };
