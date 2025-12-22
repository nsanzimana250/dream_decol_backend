const express = require('express');
const router = express.Router();
const Configuration = require('../models/Configuration');
const { protect: auth } = require('../middleware/auth');

// Get all configurations (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let configurations;
    
    if (category) {
      configurations = await Configuration.getByCategory(category);
    } else {
      configurations = await Configuration.getAll();
    }
    
    res.json({ 
      success: true, 
      configurations: configurations.map(config => ({
        key: config.key,
        value: config.value,
        description: config.description,
        category: config.category,
        isActive: config.isActive,
        updatedAt: config.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get configurations error:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get configuration by key (Admin only)
router.get('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const configuration = await Configuration.findOne({ key, isActive: true });
    
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ 
      success: true, 
      configuration: {
        key: configuration.key,
        value: configuration.value,
        description: configuration.description,
        category: configuration.category,
        isActive: configuration.isActive,
        updatedAt: configuration.updatedAt
      }
    });
  } catch (error) {
    console.error('Get configuration error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update configuration (Admin only)
router.put('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category, isActive } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const updateData = { value };
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const configuration = await Configuration.findOneAndUpdate(
      { key },
      { $set: updateData, updatedAt: new Date() },
      { new: true, upsert: false }
    );
    
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Configuration updated successfully',
      configuration: {
        key: configuration.key,
        value: configuration.value,
        description: configuration.description,
        category: configuration.category,
        isActive: configuration.isActive,
        updatedAt: configuration.updatedAt
      }
    });
  } catch (error) {
    console.error('Update configuration error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Create new configuration (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { key, value, description, category } = req.body;
    
    if (!key || value === undefined || !category) {
      return res.status(400).json({ 
        error: 'Key, value, and category are required' 
      });
    }
    
    const configuration = await Configuration.create({
      key,
      value,
      description,
      category
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Configuration created successfully',
      configuration: {
        key: configuration.key,
        value: configuration.value,
        description: configuration.description,
        category: configuration.category,
        isActive: configuration.isActive,
        updatedAt: configuration.updatedAt
      }
    });
  } catch (error) {
    console.error('Create configuration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Configuration key already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

// Delete configuration (Admin only)
router.delete('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    
    const configuration = await Configuration.findOneAndDelete({ key });
    
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Configuration deleted successfully' 
    });
  } catch (error) {
    console.error('Delete configuration error:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

// Get configurations by category (Public - for system information)
router.get('/public/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const configurations = await Configuration.getByCategory(category);
    
    // Only return active configurations with their values
    const publicConfigs = configurations
      .filter(config => config.isActive)
      .map(config => ({
        key: config.key,
        value: config.value
      }));
    
    res.json({ 
      success: true, 
      category,
      configurations: publicConfigs
    });
  } catch (error) {
    console.error('Get public configurations error:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Reset to defaults (Admin only)
router.post('/reset', auth, async (req, res) => {
  try {
    // This would require running the initialization script
    // For now, we'll just indicate that this feature needs implementation
    res.status(501).json({ 
      error: 'Reset to defaults feature not implemented yet. Please run the initializeConfigurations.js script manually.' 
    });
  } catch (error) {
    console.error('Reset configurations error:', error);
    res.status(500).json({ error: 'Failed to reset configurations' });
  }
});

module.exports = router;