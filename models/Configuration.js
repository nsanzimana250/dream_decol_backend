const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['product', 'booking', 'user', 'system', 'localization']
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

// Update the updatedAt field before saving
configurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get configuration by key
configurationSchema.statics.getConfig = function(key, defaultValue = null) {
  return this.findOne({ key, isActive: true })
    .then(config => {
      if (config) {
        return config.value;
      }
      return defaultValue;
    })
    .catch(() => defaultValue);
};

// Static method to set configuration value
configurationSchema.statics.setConfig = function(key, value, options = {}) {
  const update = {
    value,
    updatedAt: new Date()
  };
  
  if (options.description) update.description = options.description;
  if (options.category) update.category = options.category;
  
  return this.findOneAndUpdate(
    { key },
    { $set: update, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true }
  );
};

// Static method to get all configurations by category
configurationSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ key: 1 });
};

// Static method to get all configurations
configurationSchema.statics.getAll = function() {
  return this.find({ isActive: true }).sort({ category: 1, key: 1 });
};

module.exports = mongoose.model('Configuration', configurationSchema);