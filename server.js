
const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import AdminUser model for initialization
const AdminUser = require('./models/AdminUser');

const app = express();

// Start server and connect to MongoDB

// Initialize default admin user on startup
const initializeDefaultAdmin = async () => {
  try {
    const adminExists = await AdminUser.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new AdminUser({
        username: 'admin',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'superadmin',
        isActive: true
      });
      await admin.save();
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error.message);
  }
};

// Configure multer for file uploads
const uploadPath = process.env.UPLOAD_PATH || 'uploads';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fullUploadPath = path.join(__dirname, uploadPath);
    if (!fs.existsSync(fullUploadPath)) {
      fs.mkdirSync(fullUploadPath, { recursive: true });
    }
    cb(null, fullUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES ?
      process.env.ALLOWED_FILE_TYPES.split(',') :
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
// Temporary fix - replace your corsOptions with:
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    // For production, you can check against your allowed domains
    const allowedOrigins = process.env.CORS_ORIGIN ?
      process.env.CORS_ORIGIN.split(',') :
      [];

    // Allow all origins if * is in allowedOrigins
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${uploadPath}`, express.static(path.join(__dirname, uploadPath)));

// File upload endpoint
app.post('/upload', upload.single('productImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Import routes
const adminUserRoutes = require('./routes/adminUserRoutes');
const contactMessageRoutes = require('./routes/contactMessageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const productRoutes = require('./routes/productRoutes');
const { publicRouter: activityPublicRoutes, adminRouter: activityAdminRoutes } = require('./routes/activityRoutes');


// Mount API routes
app.use('/api/admin', adminUserRoutes);
app.use('/api/contact', contactMessageRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activities', activityPublicRoutes);
app.use('/api/admin/activities', activityAdminRoutes);


// Basic route
app.get('/api', (req, res) => {
  res.json({
    message: 'Dream Decol API',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin',
      products: '/api/products',
      booking: '/api/booking',
      contact: '/api/contact'
    }
  });
});




// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  const dbConnected = await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 TBuy Shop API Server (${NODE_ENV}) started on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📁 Uploads served from: http://localhost:${PORT}/${uploadPath}`);
    console.log(`📊 MongoDB: ${process.env.MONGODB_URI || 'not provided'}`);
  });

  if (dbConnected) {
    // Ensure we only initialize admin after mongoose connection is open
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      initializeDefaultAdmin();
    } else {
      mongoose.connection.once('open', initializeDefaultAdmin);
    }
  } else {
    console.warn('⚠️ Skipping admin initialization: no DB connection.');
  }

  return server;
};

startServer();
