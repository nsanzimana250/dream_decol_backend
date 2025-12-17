const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Fail fast if servers cannot be selected
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('⏹️ MongoDB connection closed through app termination');
      process.exit(0);
    });

    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    console.log('⚠️ Server will continue without database connection. Some features may not work.');
    return false;
  }
};

module.exports = connectDB;