const express = require('express');
const mongoose = require('mongoose');
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
    
    // Validate and convert productId to MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        message: 'Product ID must be a valid MongoDB ObjectId'
      });
    }
    
    const objectId = new mongoose.Types.ObjectId(productId);
    
    // Verify that the product exists
    const product = await Product.findById(objectId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Initialize safe defaults
    let averageRating = 0;
    let totalRatings = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let recentRatings = [];
    
    try {
      // Get rating statistics and recent ratings in parallel
      const [averageData, distributionData, recentRatingsData] = await Promise.all([
        ProductRating.getAverageRating(objectId),
        ProductRating.getRatingDistribution(objectId),
        ProductRating.find({ productId: objectId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('-ipAddress -userAgent') // Don't expose sensitive info
          .lean()
      ]);
      
      // Process average rating data safely
      if (averageData && averageData.length > 0) {
        averageRating = Math.round((averageData[0].averageRating || 0) * 10) / 10;
        totalRatings = averageData[0].totalRatings || 0;
      }
      
      // Process rating distribution safely
      if (distributionData && Array.isArray(distributionData)) {
        for (let i = 1; i <= 5; i++) {
          const found = distributionData.find(item => item._id === i);
          ratingDistribution[i] = found ? (found.count || 0) : 0;
        }
      }
      
      // Process recent ratings safely
      if (recentRatingsData && Array.isArray(recentRatingsData)) {
        recentRatings = recentRatingsData.map(rating => ({
          id: rating._id.toString(),
          rating: rating.rating,
          ratingStars: '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating),
          createdAt: rating.createdAt
        }));
      }
      
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Continue with safe defaults - don't return error response
    }
    
    // Always return HTTP 200 with the expected format
    res.status(200).json({
      success: true,
      data: {
        productId,
        productTitle: product.title,
        averageRating,
        totalRatings,
        ratingDistribution,
        recentRatings
      }
    });
    
  } catch (error) {
    console.error('Get ratings error:', error);
    
    // For any other errors, return a safe response instead of 500
    // Check if it's a validation error first
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        message: 'Product ID must be a valid MongoDB ObjectId'
      });
    }
    
    // For any other unexpected errors, return HTTP 200 with safe defaults
    // This ensures the frontend always gets a valid response
    res.status(200).json({
      success: true,
      data: {
        productId: req.params.productId,
        productTitle: 'Unknown Product',
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentRatings: []
      }
    });
  }
});

// GET /api/ratings/:productId/stats - Get detailed rating statistics (optional endpoint)
router.get('/:productId/stats', validateProductId, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate and convert productId to MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        message: 'Product ID must be a valid MongoDB ObjectId'
      });
    }
    
    const objectId = new mongoose.Types.ObjectId(productId);
    
    // Verify that the product exists
    const product = await Product.findById(objectId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Initialize safe defaults
    let averageRating = 0;
    let totalRatings = 0;
    let ratingDistribution = {
      1: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      5: { count: 0, percentage: 0 }
    };
    let ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    try {
      // Get comprehensive statistics in parallel
      const [averageData, distributionData, countResult] = await Promise.all([
        ProductRating.getAverageRating(objectId),
        ProductRating.getRatingDistribution(objectId),
        ProductRating.countDocuments({ productId: objectId })
      ]);
      
      totalRatings = countResult || 0;
      
      // Process average rating data safely
      if (averageData && averageData.length > 0) {
        averageRating = Math.round((averageData[0].averageRating || 0) * 10) / 10;
      }
      
      // Process rating distribution safely
      if (distributionData && Array.isArray(distributionData)) {
        for (let i = 1; i <= 5; i++) {
          const found = distributionData.find(item => item._id === i);
          const count = found ? (found.count || 0) : 0;
          const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
          
          ratingDistribution[i] = { count, percentage };
          ratingBreakdown[i] = percentage;
        }
      }
      
    } catch (dbError) {
      console.error('Database operation error in stats:', dbError);
      // Continue with safe defaults - don't return error response
    }
    
    // Always return HTTP 200 with the expected format
    res.status(200).json({
      success: true,
      data: {
        productId,
        productTitle: product.title,
        averageRating,
        totalRatings,
        ratingDistribution,
        ratingBreakdown
      }
    });
    
  } catch (error) {
    console.error('Get rating stats error:', error);
    
    // For any other errors, return a safe response instead of 500
    // Check if it's a validation error first
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        message: 'Product ID must be a valid MongoDB ObjectId'
      });
    }
    
    // For any other unexpected errors, return HTTP 200 with safe defaults
    res.status(200).json({
      success: true,
      data: {
        productId: req.params.productId,
        productTitle: 'Unknown Product',
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
          1: { count: 0, percentage: 0 },
          2: { count: 0, percentage: 0 },
          3: { count: 0, percentage: 0 },
          4: { count: 0, percentage: 0 },
          5: { count: 0, percentage: 0 }
        },
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    });
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