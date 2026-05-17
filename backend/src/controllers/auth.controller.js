const { asyncHandler } = require('../middleware/errorHandler');
const AuthService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin only in production)
 */
const register = asyncHandler(async (req, res) => {
  const userData = req.body;
  const result = await AuthService.register(userData);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  
  const user = await AuthService.updateUser(userId, updates);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  await AuthService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // This endpoint can be used for logging or token blacklisting if implemented
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await AuthService.generateToken(userId);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken
};
