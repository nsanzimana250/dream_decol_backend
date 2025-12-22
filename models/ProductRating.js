const mongoose = require('mongoose');

const productRatingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    index: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index to prevent duplicate ratings from same IP for same product
productRatingSchema.index({ productId: 1, ipAddress: 1 }, { unique: true });

// Create indexes for better query performance
productRatingSchema.index({ rating: 1 });
productRatingSchema.index({ createdAt: -1 });

// Static method to calculate average rating for a product
productRatingSchema.statics.getAverageRating = function(productId) {
  // Validate productId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    console.warn('Invalid productId provided to getAverageRating:', productId);
    return [];
  }
  
  try {
    return this.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);
  } catch (error) {
    console.error('Error in getAverageRating:', error);
    return [];
  }
};

// Static method to get rating distribution for a product
productRatingSchema.statics.getRatingDistribution = function(productId) {
  // Validate productId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    console.warn('Invalid productId provided to getRatingDistribution:', productId);
    return [];
  }
  
  try {
    return this.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
  } catch (error) {
    console.error('Error in getRatingDistribution:', error);
    return [];
  }
};

// Instance method to check if rating is valid
productRatingSchema.methods.isValidRating = function() {
  return this.rating >= 1 && this.rating <= 5 && Number.isInteger(this.rating);
};

// Virtual for rating stars (useful for frontend)
productRatingSchema.virtual('ratingStars').get(function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Ensure virtual fields are serialized
productRatingSchema.set('toJSON', { virtuals: true });
productRatingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductRating', productRatingSchema);