const mongoose = require('mongoose');
require('dotenv').config();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async ({ retries = 5, initialDelay = 2000 } = {}) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // serverSelectionTimeoutMS controls how long the driver will try to select a server
      const conn = await mongoose.connect(uri, {
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
      const msg = err && err.message ? err.message : String(err);
      console.error(`❌ MongoDB connection attempt ${attempt} failed: ${msg}`);

      if (attempt < retries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${Math.round(delay / 1000)}s... (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }

      console.log('⚠️ Server will continue without database connection. Some features may not work.');
      return false;
    }
  }
  return false;
};

module.exports = connectDB;