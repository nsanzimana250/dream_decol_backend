const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const ContactMessage = require('../models/ContactMessage');
const Activity = require('../models/Activity');
const AdminUser = require('../models/AdminUser');

const collectionsToClear = [
  { name: 'Product', model: Product },
  { name: 'Booking', model: Booking },
  { name: 'ContactMessage', model: ContactMessage },
  { name: 'Activity', model: Activity }
];

async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Check admin users before deletion
    const adminCount = await AdminUser.countDocuments();
    console.log(`👤 Admin users found: ${adminCount}`);
    if (adminCount > 0) {
      const admins = await AdminUser.find({}, 'username role isActive');
      console.log('Admin users to preserve:');
      admins.forEach(admin => {
        console.log(`  - ${admin.username} (${admin.role}) - Active: ${admin.isActive}`);
      });
    }

    console.log('\n🗑️ Clearing data from collections...\n');

    let totalDeleted = 0;
    let errors = [];

    // Clear each collection
    for (const collection of collectionsToClear) {
      try {
        const count = await collection.model.countDocuments();
        
        if (count > 0) {
          const result = await collection.model.deleteMany({});
          console.log(`✅ ${collection.name}: Deleted ${result.deletedCount} documents`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`ℹ️ ${collection.name}: No documents to delete`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${collection.name}:`, error.message);
        errors.push(`${collection.name}: ${error.message}`);
      }
    }

    // Clear MongoDB indexes to optimize performance after bulk delete
    console.log('\n🔧 Optimizing database indexes...');
    try {
      for (const collection of collectionsToClear) {
        await collection.model.syncIndexes();
      }
      console.log('✅ Database indexes optimized');
    } catch (error) {
      console.warn('⚠️ Index optimization warning:', error.message);
    }

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`Total documents deleted: ${totalDeleted}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    // Verify admin users are still intact
    const adminCountAfter = await AdminUser.countDocuments();
    console.log(`\n👤 Admin users after cleanup: ${adminCountAfter}`);
    
    if (adminCountAfter === adminCount) {
      console.log('✅ Admin users preserved successfully');
    } else {
      console.log('❌ Warning: Admin user count changed!');
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  - Run "npm run seed" to populate sample products');
    console.log('  - Test your API endpoints');
    console.log('  - Verify admin login still works');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MongoDB connection string is correct');
    console.error('2. Verify your IP is whitelisted in MongoDB Atlas');
    console.error('3. Ensure database user has delete permissions');
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  console.log('⚠️  WARNING: This will delete ALL data except admin users!');
  console.log('This action cannot be undone.\n');
  
  // Add confirmation for safety
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Type "CLEAR" to confirm database cleanup: ', (answer) => {
    if (answer === 'CLEAR') {
      clearDatabase().then(() => {
        rl.close();
        process.exit(0);
      }).catch((error) => {
        console.error('Fatal error:', error);
        rl.close();
        process.exit(1);
      });
    } else {
      console.log('❌ Cleanup cancelled. Enter "CLEAR" to confirm.');
      rl.close();
      process.exit(0);
    }
  });
}

module.exports = clearDatabase;