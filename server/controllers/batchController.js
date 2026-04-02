const Batch = require('../models/Batch');
const User = require('../models/User');

/**
 * GET /api/batches
 * List all batches for the admin's institute.
 */
const getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ instituteId: req.user.instituteId })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/batches
 * Create a new batch.
 */
const createBatch = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const batch = await Batch.create({
      name,
      description,
      students: [],
      instituteId: req.user.instituteId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, batch });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/batches/:id
 * Update batch name/description.
 */
const updateBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { name: req.body.name, description: req.body.description },
      { new: true, runValidators: true }
    ).populate('students', 'name email');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/batches/:id
 */
const deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/batches/:id/students
 * Add students to a batch by email.
 */
const addStudentsToBatch = async (req, res, next) => {
  try {
    const { emails } = req.body;
    const batch = await Batch.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const users = await User.find({
      email: { $in: emails },
      role: 'student',
      instituteId: req.user.instituteId,
    });

    const existingIds = batch.students.map((id) => id.toString());
    const newIds = users
      .filter((u) => !existingIds.includes(u._id.toString()))
      .map((u) => u._id);

    batch.students.push(...newIds);
    await batch.save();
    await batch.populate('students', 'name email');

    const notFound = emails.filter(
      (e) => !users.some((u) => u.email === e)
    );

    res.json({
      success: true,
      batch,
      added: newIds.length,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/batches/:id/students/:studentId
 * Remove a student from a batch.
 */
const removeStudentFromBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.students = batch.students.filter(
      (id) => id.toString() !== req.params.studentId
    );
    await batch.save();
    await batch.populate('students', 'name email');

    res.json({ success: true, batch });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
};
