const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  mediaType: {
    type: String,
    required: [true, 'Media type is required'],
    enum: ['image', 'video'],
    default: 'image'
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || v.startsWith('/uploads/') || v.startsWith('data:image/') || v.startsWith('data:video/');
      },
      message: 'Media URL must be a valid URL, upload path, or base64 data'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
activitySchema.index({ title: 'text', description: 'text' });
activitySchema.index({ date: -1 });
activitySchema.index({ createdAt: -1 });

// Static method to get all activities
activitySchema.statics.getAll = function() {
  return this.find().sort({ date: -1 });
};

// Static method to get activities by date range
activitySchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Static method to search activities
activitySchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query }
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Activity', activitySchema);