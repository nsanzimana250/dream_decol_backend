const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Atlas connection details
const ATLAS_CONFIG = {
  username: 'nsanzimanaesdras2_db_user',
  password: 'VDjcotwlaT0l65Bc',
  cluster: 'cluster0.1jag5yi.mongodb.net',
  database: 'dream_decol',
  ip: '129.222.149.116'
};

const ATLAS_URI = `mongodb+srv://${ATLAS_CONFIG.username}:${ATLAS_CONFIG.password}@${ATLAS_CONFIG.cluster}/?appName=Cluster0`;

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dream_decol';

class AtlasMigration {
  constructor() {
    this.atlasUri = ATLAS_URI;
    this.localUri = LOCAL_URI;
    this.dumpDir = path.join(process.cwd(), 'migration_backup');
  }

  async createBackup() {
    console.log('📦 Creating backup of local database...');
    
    // Create backup directory
    if (!fs.existsSync(this.dumpDir)) {
      fs.mkdirSync(this.dumpDir, { recursive: true });
    }

    // Backup using mongodump
    const backupCommand = `mongodump --uri "${this.localUri}" --out "${this.dumpDir}"`;
    
    try {
      await execPromise(backupCommand);
      console.log('✅ Local backup created successfully');
      return true;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      return false;
    }
  }

  async exportToJSON() {
    console.log('📄 Exporting data to JSON files...');
    
    const jsonDir = path.join(process.cwd(), 'migration_json');
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }

    // Export each collection
    const collections = [
      'products', 'productratings', 'bookings', 'contactmessages', 
      'adminusers', 'activities'
    ];

    for (const collection of collections) {
      const exportCommand = `mongoexport --uri "${this.localUri}" --collection ${collection} --out "${jsonDir}/${collection}.json"`;
      
      try {
        await execPromise(exportCommand);
        console.log(`✅ Exported ${collection} collection`);
      } catch (error) {
        if (error.message.includes('no valid documents')) {
          console.log(`ℹ️ No documents in ${collection} collection`);
        } else {
          console.warn(`⚠️ Export warning for ${collection}:`, error.message);
        }
      }
    }
  }

  async migrateToAtlas() {
    console.log('🚀 Starting migration to MongoDB Atlas...');
    
    try {
      // Connect to both databases
      const localConn = await mongoose.createConnection(this.localUri, {
        serverSelectionTimeoutMS: 10000
      }).asPromise();

      const atlasConn = await mongoose.createConnection(this.atlasUri, {
        serverSelectionTimeoutMS: 10000
      }).asPromise();

      console.log('✅ Connected to both databases');

      // Get collections from local database
      const collections = await localConn.db.listCollections().toArray();
      const collectionNames = collections
        .map(c => c.name)
        .filter(name => !name.startsWith('system.') && !name.includes('.'));

      console.log(`📋 Found collections: ${collectionNames.join(', ')}`);

      // Migrate each collection
      for (const collectionName of collectionNames) {
        console.log(`\n📤 Migrating collection: ${collectionName}`);
        
        try {
          // Get documents from local
          const documents = await localConn.db.collection(collectionName).find().toArray();
          console.log(`   Found ${documents.length} documents`);

          if (documents.length > 0) {
            // Clear existing data in Atlas (optional)
            if (process.argv.includes('--clear-atlas')) {
              await atlasConn.db.collection(collectionName).deleteMany({});
              console.log(`   🧹 Cleared existing data in Atlas ${collectionName}`);
            }

            // Insert documents in batches
            const batchSize = 500;
            for (let i = 0; i < documents.length; i += batchSize) {
              const batch = documents.slice(i, i + batchSize);
              
              try {
                await atlasConn.db.collection(collectionName).insertMany(batch, { ordered: false });
                console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
              } catch (batchError) {
                console.error(`   ❌ Batch insert error:`, batchError.message);
              }
            }
          } else {
            console.log('   ℹ️ No documents to migrate');
          }

        } catch (collectionError) {
          console.error(`   ❌ Error migrating ${collectionName}:`, collectionError.message);
        }
      }

      // Close connections
      await localConn.close();
      await atlasConn.close();

      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');
    
    try {
      const localConn = await mongoose.createConnection(this.localUri).asPromise();
      const atlasConn = await mongoose.createConnection(this.atlasUri).asPromise();

      const localCollections = await localConn.db.listCollections().toArray();
      const atlasCollections = await atlasConn.db.listCollections().toArray();

      console.log('\n📊 Migration Summary:');
      for (const localCol of localCollections) {
        if (localCol.name.startsWith('system.')) continue;
        
        const localCount = await localConn.db.collection(localCol.name).countDocuments();
        const atlasCount = await atlasConn.db.collection(localCol.name).countDocuments();
        
        const status = localCount === atlasCount ? '✅' : '⚠️';
        console.log(`${status} ${localCol.name}: ${localCount} → ${atlasCount} documents`);
      }

      await localConn.close();
      await atlasConn.close();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  async runFullMigration() {
    console.log('🔄 Starting full migration process...\n');

    try {
      // Step 1: Create backup
      await this.createBackup();
      
      // Step 2: Export to JSON
      await this.exportToJSON();
      
      // Step 3: Migrate to Atlas
      await this.migrateToAtlas();
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      console.log('\n✅ Full migration process completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Update your .env file with the new MONGODB_URI');
      console.log('2. Update db.js if needed');
      console.log('3. Test your application');
      
    } catch (error) {
      console.error('\n❌ Migration process failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const migration = new AtlasMigration();
  const args = process.argv.slice(2);
  
  if (args.includes('--backup')) {
    migration.createBackup();
  } else if (args.includes('--export')) {
    migration.exportToJSON();
  } else if (args.includes('--migrate')) {
    migration.migrateToAtlas();
  } else if (args.includes('--verify')) {
    migration.verifyMigration();
  } else if (args.includes('--full')) {
    migration.runFullMigration();
  } else {
    console.log(`
🚀 MongoDB Atlas Migration Tool

Usage:
  node scripts/atlasMigration.js [options]

Options:
  --backup     Create backup of local database
  --export     Export data to JSON files
  --migrate    Migrate data to Atlas
  --verify     Verify migration
  --full       Run full migration process (backup + export + migrate + verify)
  --clear-atlas Clear existing data in Atlas before migration

Example:
  node scripts/atlasMigration.js --full
  node scripts/atlasMigration.js --migrate --clear-atlas
    `);
  }
}

module.exports = AtlasMigration;