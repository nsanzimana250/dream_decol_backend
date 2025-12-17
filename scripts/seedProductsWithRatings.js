const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../db');

// Sample products with ratings
const sampleProducts = [
  {
    title: 'Luna Velvet Sofa',
    sku: 'LUNA-001',
    price: 2499.99,
    currency: 'USD',
    shortDescription: 'Luxurious 3-seat sofa in premium Italian velvet',
    description: 'The Luna Velvet Sofa embodies contemporary elegance with its clean lines and sumptuous comfort. Crafted with a solid oak frame and premium Italian velvet upholstery, this piece transforms any living space into a sanctuary of style. The deep, sink-in cushions are filled with high-resilience foam and wrapped in down feathers for the perfect balance of support and softness. Available in a palette of rich, earthy tones that complement any interior.',
    dimensions: { width: '220cm', depth: '95cm', height: '82cm' },
    materials: ['Italian Velvet', 'Solid Oak Frame', 'High-Resilience Foam', 'Down Feathers'],
    mainImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484101403633-571e2f1e5dc1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['sofa', 'velvet', 'luxury'],
    category: 'living-room',
    featured: true,
    status: 'active',
    rating: 4.8,
    reviewCount: 12,
  },
  {
    title: 'Aurora Dining Table',
    sku: 'AURORA-002',
    price: 1899.99,
    currency: 'USD',
    shortDescription: 'Sculptural dining table with live edge walnut top',
    description: 'The Aurora Dining Table is a statement piece that brings the beauty of nature indoors. Each table features a unique live edge American black walnut top, hand-selected for its distinctive grain patterns and natural character. The sculptural steel base provides a striking contrast, finished in matte black to highlight the wood\'s organic warmth. Seats 6-8 guests comfortably.',
    dimensions: { width: '240cm', depth: '100cm', height: '76cm' },
    materials: ['American Black Walnut', 'Steel Base', 'Natural Oil Finish'],
    mainImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['table', 'dining', 'walnut'],
    category: 'dining',
    featured: true,
    status: 'active',
    rating: 4.5,
    reviewCount: 8,
  },
  {
    title: 'Serene Bed Frame',
    sku: 'SERENE-003',
    price: 2199.99,
    currency: 'USD',
    shortDescription: 'Minimalist platform bed with floating nightstands',
    description: 'The Serene Bed Frame redefines bedroom aesthetics with its floating design and integrated nightstands. Crafted from solid white oak with subtle grain patterns, this bed frame creates an illusion of weightlessness while providing exceptional stability. The low-profile platform design eliminates the need for a box spring, and hidden LED strips create ambient lighting for a tranquil atmosphere.',
    dimensions: { width: '180cm', depth: '220cm', height: '35cm' },
    materials: ['Solid White Oak', 'Steel Support', 'LED Lighting System'],
    mainImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['bed', 'bedroom', 'minimalist'],
    category: 'bedroom',
    featured: true,
    status: 'active',
    rating: 5.0,
    reviewCount: 20,
  },
  {
    title: 'Noir Executive Desk',
    sku: 'NOIR-004',
    price: 1599.99,
    currency: 'USD',
    shortDescription: 'Modern executive desk with cable management',
    description: 'The Noir Executive Desk combines form and function for the modern professional. The expansive work surface is crafted from black-stained ash with a subtle satin finish. Integrated cable management keeps your workspace clean, while two soft-close drawers provide ample storage. The geometric steel legs add architectural interest.',
    dimensions: { width: '180cm', depth: '80cm', height: '75cm' },
    materials: ['Black-Stained Ash', 'Steel Legs', 'Soft-Close Hardware'],
    mainImage: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587212786243-34fe0af01c4f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['desk', 'office', 'executive'],
    category: 'office',
    status: 'active',
    rating: 4.2,
    reviewCount: 5,
  },
  {
    title: 'Haven Lounge Chair',
    sku: 'HAVEN-005',
    price: 899.99,
    currency: 'USD',
    shortDescription: 'Curved lounge chair with bouclé upholstery',
    description: 'The Haven Lounge Chair invites you to curl up in comfort. Its organic, curved form is upholstered in textured bouclé fabric that\'s as soft as it looks. The swivel base allows 360-degree rotation, perfect for conversation or contemplation. A sculptural accent piece that adds warmth to any room.',
    dimensions: { width: '85cm', depth: '90cm', height: '78cm' },
    materials: ['Bouclé Fabric', 'Foam Padding', 'Swivel Steel Base'],
    mainImage: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['chair', 'lounge', 'boucle'],
    category: 'living-room',
    featured: true,
    status: 'active',
    rating: 4.7,
    reviewCount: 15,
  },
  {
    title: 'Terra Outdoor Sofa',
    sku: 'TERRA-006',
    price: 3299.99,
    currency: 'USD',
    shortDescription: 'Weather-resistant modular outdoor sofa',
    description: 'The Terra Outdoor Sofa brings indoor comfort to your outdoor living space. Constructed with marine-grade aluminum and all-weather wicker, this modular system withstands the elements while maintaining its beauty. Quick-dry foam cushions with Sunbrella fabric ensure lasting comfort and color retention. Configure to fit your space.',
    dimensions: { width: '280cm', depth: '100cm', height: '70cm' },
    materials: ['Marine-Grade Aluminum', 'All-Weather Wicker', 'Sunbrella Fabric'],
    mainImage: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['outdoor', 'sofa', 'modular'],
    category: 'outdoor',
    status: 'active',
    rating: 4.9,
    reviewCount: 7,
  },
  {
    title: 'Oslo Sideboard',
    sku: 'OSLO-007',
    price: 1299.99,
    currency: 'USD',
    shortDescription: 'Mid-century sideboard with brass accents',
    description: 'The Oslo Sideboard pays homage to mid-century design while feeling entirely contemporary. Crafted from solid walnut with brass-tipped legs and handle details, it offers generous storage with adjustable shelving and cable management for media components.',
    dimensions: { width: '180cm', depth: '45cm', height: '80cm' },
    materials: ['Solid Walnut', 'Brass Hardware', 'Adjustable Shelving'],
    mainImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484101403633-571e2f1e5dc1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['sideboard', 'storage', 'mid-century'],
    category: 'living-room',
    status: 'active',
    rating: 4.0,
    reviewCount: 3,
  },
  {
    title: 'Drift Coffee Table',
    sku: 'DRIFT-008',
    price: 799.99,
    currency: 'USD',
    shortDescription: 'Organic-shaped coffee table in natural stone',
    description: 'The Drift Coffee Table brings organic beauty to your living space with its free-form travertine top. Each piece is unique, featuring natural veining and tonal variations. The solid stone construction ensures durability and timeless appeal.',
    dimensions: { width: '120cm', depth: '80cm', height: '40cm' },
    materials: ['Natural Travertine', 'Filled and Honed Finish'],
    mainImage: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['coffee-table', 'stone', 'organic'],
    category: 'living-room',
    status: 'active',
    rating: 3.5,
    reviewCount: 2,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Deleting existing products...');
    await Product.deleteMany({});
    
    console.log('🌱 Seeding database with products...');
    await Product.insertMany(sampleProducts);
    
    console.log('✅ Database seeded successfully!');
    console.log(`📊 Inserted ${sampleProducts.length} products with ratings`);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
