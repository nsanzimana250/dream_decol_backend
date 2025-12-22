const mongoose = require('mongoose');
const Product = require('../models/Product');
const Configuration = require('../models/Configuration');
const { faker } = require('@faker-js/faker');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dreamdecol')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

// Dynamic data that will be loaded from configuration
let categories = [];
let materialsList = [];

// Load configuration data
async function loadConfiguration() {
  try {
    categories = await Configuration.getConfig('product.categories', ['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor']);
    materialsList = await Configuration.getConfig('product.materials', ['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Ceramic', 'Bamboo']);
    console.log('✅ Configuration loaded successfully');
  } catch (error) {
    console.error('⚠️ Error loading configuration, using defaults:', error.message);
    // Fallback to defaults
    categories = ['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor'];
    materialsList = ['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Ceramic', 'Bamboo'];
  }
}

// Generate 10 sample products
let sampleProducts = [];

async function generateSampleProducts() {
  await loadConfiguration(); // Load configuration first
  
  sampleProducts = [];
  
  for (let i = 1; i <= 10; i++) {
    const materials = faker.helpers.arrayElements(materialsList, 2);
    
    sampleProducts.push({
      title: `Sample Product ${i}: ${faker.commerce.productName()}`,
      sku: `SAMPLE-${i.toString().padStart(3, '0')}`,
      price: parseFloat(faker.commerce.price(10, 1000, 2)),
      currency: 'USD',
      shortDescription: faker.commerce.productDescription(),
      description: faker.lorem.paragraphs(2, '\n\n'),
      dimensions: {
        width: `${faker.number.int({ min: 30, max: 200 })}cm`,
        depth: `${faker.number.int({ min: 20, max: 100 })}cm`,
        height: `${faker.number.int({ min: 50, max: 250 })}cm`,
      },
      materials: materials,
      mainImage: `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000, max: 1600000 })}?w=800&h=600&fit=crop`,
      images: [
        `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000, max: 1600000 })}?w=400&h=400&fit=crop`,
        `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000, max: 1600000 })}?w=400&h=400&fit=crop`,
        '',
        '',
      ],
      videoUrl: faker.datatype.boolean(0.3) ? `https://www.youtube.com/embed/${faker.string.alphanumeric(11)}` : '',
      tags: faker.helpers.arrayElements(['furniture', 'decor', 'home', 'modern', 'classic', 'luxury'], 2),
      category: faker.helpers.arrayElements(categories)[0],
      featured: faker.datatype.boolean(0.2),
      inStock: true,
      stockQuantity: faker.number.int({ min: 0, max: 100 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
}

// Insert sample products
async function seedProducts() {
  try {
    await generateSampleProducts(); // Generate products with dynamic data
    
    // Clear existing products (optional - comment out if you want to keep existing data)
    await Product.deleteMany({});
    console.log('Existing products cleared');
    
    // Insert new products
    await Product.insertMany(sampleProducts);
    console.log(`Successfully inserted ${sampleProducts.length} sample products`);
    
    // Count products
    const count = await Product.countDocuments();
    console.log(`Total products in database: ${count}`);
    console.log(`Used ${categories.length} categories and ${materialsList.length} materials from configuration`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding products:', error);
    mongoose.connection.close();
  }
}

seedProducts();