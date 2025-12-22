const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const Configuration = require('../models/Configuration');
const readline = require('readline');
require('dotenv').config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for admin setup'))
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists with username: admin');
      const answer = await askQuestion('Do you want to create another admin user? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        mongoose.connection.close();
        return;
      }
    }
    
    // Get configuration values
    const availableRoles = await AdminUser.getAvailableRoles();
    const defaultRole = await AdminUser.getDefaultRole();
    
    console.log('\n📋 Available roles:', availableRoles.join(', '));
    console.log('🔑 Default role:', defaultRole);
    
    // Get user input
    const username = await askQuestion('Enter admin username: ');
    if (!username || username.length < 3) {
      console.log('❌ Username must be at least 3 characters long');
      rl.close();
      mongoose.connection.close();
      return;
    }
    
    const password = await askQuestion('Enter admin password: ');
    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      rl.close();
      mongoose.connection.close();
      return;
    }
    
    console.log('\nAvailable roles:', availableRoles.join(', '));
    const roleInput = await askQuestion(`Enter role (default: ${defaultRole}): `);
    const role = roleInput || defaultRole;
    
    // Validate role
    if (!availableRoles.includes(role)) {
      console.log(`❌ Invalid role: ${role}. Valid roles are: ${availableRoles.join(', ')}`);
      rl.close();
      mongoose.connection.close();
      return;
    }
    
    // Check if username already exists
    const usernameExists = await AdminUser.findOne({ username });
    if (usernameExists) {
      console.log(`❌ Username "${username}" already exists`);
      rl.close();
      mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const adminUser = new AdminUser({
      username,
      password,
      role,
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`   Username: ${username}`);
    console.log(`   Role: ${role}`);
    console.log(`   Status: Active`);
    
    // Show configuration information
    console.log('\n📊 System Configuration:');
    console.log(`   Available roles: ${availableRoles.join(', ')}`);
    console.log(`   Default role: ${defaultRole}`);
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);
    
    // Handle specific errors
    if (error.code === 11000) {
      console.log('❌ Username already exists. Please choose a different username.');
    } else if (error.name === 'ValidationError') {
      console.log('❌ Validation error:', Object.values(error.errors).map(err => err.message).join(', '));
    }
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

// Run the setup
setupAdminUser();