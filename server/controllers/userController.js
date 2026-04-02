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

module.exports = { getMe, updateMe };
