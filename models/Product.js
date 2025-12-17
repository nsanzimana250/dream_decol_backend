const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'RWF',
    enum: ['USD', 'EUR', 'RWF']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    minlength: [10, 'Short description must be at least 10 characters long'],
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  description: {
    type: String,
    required: [true, 'Full description is required'],
    trim: true,
    minlength: [20, 'Full description must be at least 20 characters long'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  dimensions: {
    width: {
      type: String,
      trim: true
    },
    depth: {
      type: String,
      trim: true
    },
    height: {
      type: String,
      trim: true
    }
  },
  materials: [{
    type: String,
    trim: true
  }],
  mainImage: {
    type: String,
    required: [true, 'Main image is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v) || v.startsWith('/uploads/') || v.startsWith('data:image/');
      },
      message: 'Main image must be a valid URL, upload path, or base64 data'
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v === '' || /^https?:\/\/.+/.test(v) || v.startsWith('/uploads/') || v.startsWith('data:image/');
      },
      message: 'Each image must be a valid URL, upload path, or base64 data'
    }
  }],
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Accept both embed URLs and watch URLs, convert watch to embed
        return /^https?:\/\/(www\.)?(youtube\.com\/(embed\/|watch\?v=)|vimeo\.com\/)/.test(v);
      },
      message: 'Video URL must be a valid YouTube or Vimeo URL'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true,
    enum: ['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor']
  },
  featured: {
    type: Boolean,
    default: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  weight: {
    type: String,
    trim: true
  },
  assemblyRequired: {
    type: Boolean,
    default: false
  },
  warranty: {
    type: String,
    trim: true
  },
  careInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Care instructions cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  reviewCount: {
    type: Number,
    min: [0, 'Review count cannot be negative'],
    default: 0
  },
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
productSchema.index({ title: 'text', shortDescription: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.price);
});

// Virtual for dimensions string
productSchema.virtual('dimensionsString').get(function() {
  return `${this.dimensions.width} × ${this.dimensions.depth} × ${this.dimensions.height}`;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Static method to find by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, status: 'active' });
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'active' });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, options = {}) {
  const { category, minPrice, maxPrice, featured, limit = 20, page = 1 } = options;
  
  let searchQuery = { status: 'active' };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (category && category !== 'all') {
    searchQuery.category = category;
  }
  
  if (featured !== undefined) {
    searchQuery.featured = featured;
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
    if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);