const mongoose = require('mongoose');

const productRatingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
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
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create indexes for better query performance
productRatingSchema.index({ productId: 1 });
productRatingSchema.index({ rating: 1 });
productRatingSchema.index({ createdAt: -1 });

// Static method to calculate average rating for a product
productRatingSchema.statics.getAverageRating = function(productId) {
  try {
    // Handle string or ObjectId input safely
    let objectId;
    if (productId instanceof mongoose.Types.ObjectId) {
      objectId = productId;
    } else if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
      objectId = new mongoose.Types.ObjectId(productId);
    } else {
      console.warn('Invalid productId provided to getAverageRating:', productId);
      return Promise.resolve([]);
    }
    
    return this.aggregate([
      { $match: { productId: objectId } },
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
    return Promise.resolve([]);
  }
};

// Static method to get rating distribution for a product
productRatingSchema.statics.getRatingDistribution = function(productId) {
  try {
    // Handle string or ObjectId input safely
    let objectId;
    if (productId instanceof mongoose.Types.ObjectId) {
      objectId = productId;
    } else if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
      objectId = new mongoose.Types.ObjectId(productId);
    } else {
      console.warn('Invalid productId provided to getRatingDistribution:', productId);
      return Promise.resolve([]);
    }
    
    return this.aggregate([
      { $match: { productId: objectId } },
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
    return Promise.resolve([]);
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