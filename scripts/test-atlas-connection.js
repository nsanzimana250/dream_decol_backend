const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/dream_decol?appName=Cluster0';

async function testAtlasConnection() {
  try {
    console.log('🔗 Testing connection to MongoDB Atlas...');
    
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas successfully');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections found:');
    collections.forEach(collection => {
      if (!collection.name.startsWith('system.')) {
        console.log(`  - ${collection.name}`);
      }
    });
    
    // Get document counts for each collection
    console.log('\n📊 Document counts:');
    for (const collection of collections) {
      if (!collection.name.startsWith('system.')) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name}: ${count} documents`);
      }
    }
    
    // Test products collection
    console.log('\n🛍️ Testing products collection...');
    const Product = require('../models/Product');
    const products = await Product.find().limit(2).lean();
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('Sample product:', {
        id: products[0]._id,
        title: products[0].title,
        price: products[0].price
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Atlas connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Atlas connection test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAtlasConnection();