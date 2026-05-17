const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { ApiError } = require('../middleware/errorHandler');

class AuthService {
  /**
   * Login user and generate JWT token
   */
  static async login(email, password) {
    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId
      }
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Register new user (admin only)
   */
  static async register(userData) {
    const name = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate manager if provided
    if (userData.managerId) {
      const manager = await User.findByPk(userData.managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        throw new Error('Specified user is not a manager');
      }
    }

    // Create user
    const user = await User.create({
      email: userData.email.toLowerCase(),
      passwordHash: userData.password, // Will be hashed by model hook
      name,
      role: userData.role || 'employee',
      managerId: userData.managerId || null,
      department: userData.department || null,
      isActive: true
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId
    };
  }

  /**
   * Update user password
   */
  static async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by model hook
    await user.save();

    return { message: 'Password updated successfully' };
  }

  /**
   * Reset password (admin only)
   */
  static async resetPassword(userId, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by model hook
    await user.save();

    return { message: 'Password reset successfully' };
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(filters = {}) {
    const where = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const users = await User.findAll({
      where: where,
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    return users;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Only allow updating certain fields
    const allowedFields = ['name', 'department'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    await user.update(filteredUpdates);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId
    };
  }

  static async updateUser(userId, updates) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const allowedFields = ['name', 'role', 'managerId', 'department', 'isActive'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    await user.update(filteredUpdates);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId,
      isActive: user.isActive
    };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    return this.updatePassword(userId, currentPassword, newPassword);
  }

  static async generateToken(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId
      }
    };
  }

  /**
   * Deactivate user (admin only)
   */
  static async deactivateUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: false });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Activate user (admin only)
   */
  static async activateUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: true });

    return { message: 'User activated successfully' };
  }
}

module.exports = AuthService;
