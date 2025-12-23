const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 20
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate date format (YYYY-MM-DD) and ensure it's not in the past
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(v)) return false;
        const selectedDate = new Date(v);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      message: 'Please select a valid future date'
    }
  },
  time: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    default: 'pending'
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
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
bookingSchema.index({ date: 1, time: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for time with AM/PM
bookingSchema.virtual('formattedTime').get(function() {
  const [hours, minutes] = this.time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Static method to get available time slots
bookingSchema.statics.getAvailableTimeSlots = function() {
  return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
};

// Static method to get available service types
bookingSchema.statics.getAvailableServiceTypes = function() {
  return ['consultation', 'showroom-visit', 'home-measurement', 'delivery'];
};

// Static method to get available statuses
bookingSchema.statics.getAvailableStatuses = function() {
  return ['pending', 'confirmed', 'completed', 'cancelled'];
};

// Pre-save middleware to validate time slot
bookingSchema.pre('save', async function(next) {
  if (this.isModified('time')) {
    const validTimeSlots = await this.constructor.getAvailableTimeSlots();
    if (!validTimeSlots.includes(this.time)) {
      return next(new Error(`Invalid time slot: ${this.time}. Valid time slots are: ${validTimeSlots.join(', ')}`));
    }
  }
  next();
});

// Pre-save middleware to validate service type
bookingSchema.pre('save', async function(next) {
  if (this.isModified('serviceType')) {
    const validServiceTypes = await this.constructor.getAvailableServiceTypes();
    if (!validServiceTypes.includes(this.serviceType)) {
      return next(new Error(`Invalid service type: ${this.serviceType}. Valid service types are: ${validServiceTypes.join(', ')}`));
    }
  }
  next();
});

// Pre-save middleware to validate status
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const validStatuses = await this.constructor.getAvailableStatuses();
    if (!validStatuses.includes(this.status)) {
      return next(new Error(`Invalid status: ${this.status}. Valid statuses are: ${validStatuses.join(', ')}`));
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);