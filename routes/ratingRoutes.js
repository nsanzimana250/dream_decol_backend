const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ProductRating = require('../models/ProductRating');
const Product = require('../models/Product');
const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validation rules for creating a rating
const validateRating = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  handleValidationErrors
];

// Validation rules for product ID parameter
const validateProductId = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
  handleValidationErrors
];

// Middleware to capture IP address and user agent
const captureRequestInfo = (req, res, next) => {
  // Get real IP address (considering proxies)
  req.clientIP = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                 'unknown';
  
  // Clean up IP address (remove IPv6 prefix if present)
  if (req.clientIP && req.clientIP.startsWith('::ffff:')) {
    req.clientIP = req.clientIP.substring(7);
  }
  
  req.userAgent = req.get('User-Agent') || '';
  next();
};

// Middleware to check for duplicate rating
const checkDuplicateRating = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const ipAddress = req.clientIP;
    
    const existingRating = await ProductRating.findOne({
      productId: productId,
      ipAddress: ipAddress
    });
    
    if (existingRating) {
      return res.status(409).json({
        error: 'You have already rated this product from this device/IP address',
        message: 'Each customer can only rate a product once per device',
        existingRating: {
          id: existingRating._id,
          rating: existingRating.rating,
          createdAt: existingRating.createdAt
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Check duplicate rating error:', error);
    res.status(500).json({ error: 'Failed to check duplicate rating' });
  }
};

// POST /api/ratings - Submit a rating for a product
router.post('/', captureRequestInfo, validateRating, checkDuplicateRating, async (req, res) => {
  try {
    const { productId, rating } = req.body;
    const ipAddress = req.clientIP;
    const userAgent = req.userAgent;
    
    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Create the rating
    const productRating = new ProductRating({
      productId,
      rating,
      ipAddress,
      userAgent
    });
    
    await productRating.save();
    
    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      rating: {
        id: productRating._id,
        productId: productRating.productId,
        rating: productRating.rating,
        createdAt: productRating.createdAt
      }
    });
  } catch (error) {
    console.error('Create rating error:', error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        error: 'You have already rated this product from this device/IP address',
        message: 'Each customer can only rate a product once per device'
      });
    }
    
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/ratings/:productId - Get ratings for a specific product
router.get('/:productId', validateProductId, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get average rating and total count
    const averageData = await ProductRating.getAverageRating(productId);
    const averageRating = averageData.length > 0 ? averageData[0].averageRating : 0;
    const totalRatings = averageData.length > 0 ? averageData[0].totalRatings : 0;
    
    // Get rating distribution
    const distributionData = await ProductRating.getRatingDistribution(productId);
    
    // Format distribution (ensure all ratings 1-5 are represented)
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distributionData.find(item => item._id === i);
      ratingDistribution[i] = found ? found.count : 0;
    }
    
    // Get recent ratings (last 10)
    const recentRatings = await ProductRating.find({ productId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-ipAddress -userAgent') // Don't expose sensitive info
      .lean();
    
    res.json({
      success: true,
      data: {
        productId,
        productTitle: product.title,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings,
        ratingDistribution,
        recentRatings: recentRatings.map(rating => ({
          id: rating._id,
          rating: rating.rating,
          ratingStars: '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating),
          createdAt: rating.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// GET /api/ratings/:productId/stats - Get detailed rating statistics (optional endpoint)
router.get('/:productId/stats', validateProductId, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get comprehensive statistics
    const [averageData, distributionData, totalRatings] = await Promise.all([
      ProductRating.getAverageRating(productId),
      ProductRating.getRatingDistribution(productId),
      ProductRating.countDocuments({ productId })
    ]);
    
    const averageRating = averageData.length > 0 ? averageData[0].averageRating : 0;
    
    // Calculate percentage distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distributionData.find(item => item._id === i);
      const count = found ? found.count : 0;
      ratingDistribution[i] = {
        count,
        percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
      };
    }
    
    res.json({
      success: true,
      data: {
        productId,
        productTitle: product.title,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingDistribution,
        ratingBreakdown: {
          5: ratingDistribution[5].percentage,
          4: ratingDistribution[4].percentage,
          3: ratingDistribution[3].percentage,
          2: ratingDistribution[2].percentage,
          1: ratingDistribution[1].percentage
        }
      }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({ error: 'Failed to fetch rating statistics' });
  }
});

// DELETE /api/ratings/:ratingId - Delete a rating (optional - for admin use)
router.delete('/:ratingId', [
  param('ratingId').isMongoId().withMessage('Valid rating ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { ratingId } = req.params;
    
    const rating = await ProductRating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    await ProductRating.findByIdAndDelete(ratingId);
    
    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

module.exports = router;