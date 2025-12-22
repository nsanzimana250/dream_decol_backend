const mongoose = require('mongoose');
const Configuration = require('../models/Configuration');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for configuration initialization'))
  .catch(err => console.error('Connection error:', err));

// Default configurations
const defaultConfigurations = [
  // Product categories
  {
    key: 'product.categories',
    value: ['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor'],
    description: 'Available product categories',
    category: 'product'
  },
  
  // Product materials
  {
    key: 'product.materials',
    value: ['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Ceramic', 'Bamboo'],
    description: 'Available product materials',
    category: 'product'
  },
  
  // Currencies
  {
    key: 'product.currencies',
    value: ['USD', 'EUR', 'RWF'],
    description: 'Supported currencies',
    category: 'product'
  },
  
  // Default currency
  {
    key: 'product.defaultCurrency',
    value: 'RWF',
    description: 'Default currency for products',
    category: 'product'
  },
  
  // Booking time slots
  {
    key: 'booking.timeSlots',
    value: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    description: 'Available booking time slots',
    category: 'booking'
  },
  
  // Booking service types
  {
    key: 'booking.serviceTypes',
    value: ['consultation', 'showroom-visit', 'home-measurement', 'delivery'],
    description: 'Available booking service types',
    category: 'booking'
  },
  
  // Booking statuses
  {
    key: 'booking.statuses',
    value: ['pending', 'confirmed', 'completed', 'cancelled'],
    description: 'Available booking statuses',
    category: 'booking'
  },
  
  // Admin roles
  {
    key: 'user.adminRoles',
    value: ['superadmin', 'admin', 'moderator'],
    description: 'Available admin user roles',
    category: 'user'
  },
  
  // Default admin role
  {
    key: 'user.defaultAdminRole',
    value: 'admin',
    description: 'Default role for new admin users',
    category: 'user'
  },
  
  // System settings
  {
    key: 'system.upload.maxFileSize',
    value: 5242880, // 5MB in bytes
    description: 'Maximum file upload size in bytes',
    category: 'system'
  },
  
  {
    key: 'system.upload.allowedTypes',
    value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    description: 'Allowed file types for uploads',
    category: 'system'
  },
  
  {
    key: 'system.upload.activityMaxFileSize',
    value: 10485760, // 10MB in bytes
    description: 'Maximum file upload size for activities in bytes',
    category: 'system'
  },
  
  {
    key: 'system.upload.activityAllowedTypes',
    value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
    description: 'Allowed file types for activity uploads',
    category: 'system'
  },
  
  // CORS settings
  {
    key: 'system.cors.allowedOrigins',
    value: ['*'],
    description: 'Allowed CORS origins (comma-separated)',
    category: 'system'
  },
  
  // Pagination defaults
  {
    key: 'system.pagination.defaultLimit',
    value: 12,
    description: 'Default pagination limit',
    category: 'system'
  },
  
  {
    key: 'system.pagination.adminLimit',
    value: 10,
    description: 'Default pagination limit for admin pages',
    category: 'system'
  },
  
  // Localization
  {
    key: 'localization.defaultLanguage',
    value: 'en',
    description: 'Default language code',
    category: 'localization'
  },
  
  {
    key: 'localization.timezone',
    value: 'UTC',
    description: 'Default timezone',
    category: 'localization'
  },
  
  // Server configuration
  {
    key: 'system.server.port',
    value: 5000,
    description: 'Default server port',
    category: 'system'
  },
  
  {
    key: 'system.server.environment',
    value: 'development',
    description: 'Default server environment',
    category: 'system'
  }
];

// Initialize configurations
async function initializeConfigurations() {
  try {
    console.log('🔧 Initializing system configurations...');
    
    for (const config of defaultConfigurations) {
      const existingConfig = await Configuration.findOne({ key: config.key });
      
      if (!existingConfig) {
        await Configuration.create(config);
        console.log(`✅ Created configuration: ${config.key}`);
      } else {
        console.log(`⚠️ Configuration already exists: ${config.key}`);
      }
    }
    
    console.log('🎉 Configuration initialization completed!');
    
    // Display all configurations
    const allConfigs = await Configuration.getAll();
    console.log('\n📋 Current configurations:');
    allConfigs.forEach(config => {
      console.log(`  ${config.category}.${config.key}: ${JSON.stringify(config.value)}`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing configurations:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the initialization
initializeConfigurations();