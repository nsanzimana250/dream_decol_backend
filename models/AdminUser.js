const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
AdminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set default role before saving if not provided
AdminUserSchema.pre('save', async function(next) {
  if (!this.role) {
    this.role = await this.constructor.getDefaultRole();
  }
  next();
});

// Update updatedAt field before saving
AdminUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare passwords
AdminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
AdminUserSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: this._id, username: this.username, role: this.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// Static method to get available roles
AdminUserSchema.statics.getAvailableRoles = function() {
  return ['superadmin', 'admin', 'moderator'];
};

// Static method to get default role
AdminUserSchema.statics.getDefaultRole = function() {
  return 'admin';
};

// Pre-save middleware to validate role
AdminUserSchema.pre('save', async function(next) {
  if (this.isModified('role')) {
    const validRoles = await this.constructor.getAvailableRoles();
    if (!validRoles.includes(this.role)) {
      return next(new Error(`Invalid role: ${this.role}. Valid roles are: ${validRoles.join(', ')}`));
    }
  }
  next();
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);