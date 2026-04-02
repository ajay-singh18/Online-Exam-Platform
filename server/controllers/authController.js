const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Institute = require('../models/Institute');
const { sendVerificationEmail } = require('../utils/email');

/* Generate JWT tokens */
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/register
 * Register admin or student. Admin registration creates an institute.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, instituteName, instituteId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let userInstituteId = instituteId;

    /* If registering as admin, create a new institute */
    if (role === 'admin' && instituteName) {
      const institute = await Institute.create({
        name: instituteName,
        ownerEmail: email,
      });
      userInstituteId = institute._id;
    }

    /* If registering as student, an instituteId must be provided */
    if (role === 'student' && !userInstituteId) {
      return res.status(400).json({ message: 'Institute ID is required for students' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'student',
      instituteId: userInstituteId,
      verificationToken,
      isVerified: false,
    });

    /* Send verification email */
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Return accessToken (15min) + refreshToken (7d, httpOnly cookie).
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('instituteId', 'name plan');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    /* Store refresh token in DB */
    user.refreshToken = refreshToken;
    await user.save();

    /* Set httpOnly cookie for refresh token */
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        instituteId: user.instituteId,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Issue new accessToken from refresh cookie.
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear refresh cookie and DB token.
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET).catch(() => null);
      if (decoded) {
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      }
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email/:token
 * Verify user's email address.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, verifyEmail };
