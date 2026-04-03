const User = require('../models/User');

/**
 * GET /api/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshToken -verificationToken')
      .populate('instituteId', 'name plan');

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/me
 * Update name or password.
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (password) user.passwordHash = password; // pre-save hook will hash it

    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * SuperAdmin: fetch all users across all institutes.
 */
const getUsers = async (req, res, next) => {
  try {
    // Populate institute info
    const users = await User.find()
      .select('-passwordHash -refreshToken -verificationToken')
      .populate('instituteId', 'name plan')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/status
 * SuperAdmin: toggle user status between Active and Suspended.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, user: { _id: user._id, status: user.status } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, getUsers, updateUserStatus };
