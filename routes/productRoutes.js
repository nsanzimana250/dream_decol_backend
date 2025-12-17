const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect: auth } = require('../middleware/auth');

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.q || '';
    const category = req.query.category;
    const sort = req.query.sort || 'newest';

    let query = { status: 'active' };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort object
    let sortObj = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'name':
        sortObj = { title: 1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(limit);
    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      products,
      pagination: {
        current: page,
        total: totalPages,
        count: products.length,
        totalCount
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get featured products (Public)
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active', featured: true }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get categories (Public)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('-', ' '),
      count: cat.count
    }));

    res.json({ success: true, categories: formattedCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get products (Admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product (Admin only)
router.post('/admin', auth, async (req, res) => {
  try {
    // Convert YouTube watch URLs to embed URLs
    if (req.body.videoUrl && req.body.videoUrl.includes('youtube.com/watch')) {
      const url = new URL(req.body.videoUrl);
      const videoId = url.searchParams.get('v');
      if (videoId) {
        req.body.videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Check if SKU already exists
    if (req.body.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(400).json({
          error: `SKU "${req.body.sku}" already exists. Please use a different SKU.`
        });
      }
    }
    
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        error: `Duplicate ${field}: "${value}" already exists. Please use a different value.`
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Update product (Admin only)
router.put('/admin/:id', auth, async (req, res) => {
  try {
    // Convert YouTube watch URLs to embed URLs
    if (req.body.videoUrl && req.body.videoUrl.includes('youtube.com/watch')) {
      const url = new URL(req.body.videoUrl);
      const videoId = url.searchParams.get('v');
      if (videoId) {
        req.body.videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Check if SKU is being changed and already exists
    if (req.body.sku) {
      const existingProduct = await Product.findOne({
        sku: req.body.sku,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          error: `SKU "${req.body.sku}" already exists. Please use a different SKU.`
        });
      }
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        error: `Duplicate ${field}: "${value}" already exists. Please use a different value.`
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Delete product (Admin only)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get product by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get related products (Public)
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      status: 'active',
      category: product.category,
      _id: { $ne: product._id }
    }).sort({ createdAt: -1 }).limit(4);

    res.json({ success: true, products: relatedProducts });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});


module.exports = router;
