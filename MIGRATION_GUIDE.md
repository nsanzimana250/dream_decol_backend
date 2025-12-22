# MongoDB Atlas Migration Guide

This guide will help you migrate your Dream Decol backend from local MongoDB to MongoDB Atlas using the provided credentials and connection details.

## 🔗 Atlas Connection Details

- **Username:** `nsanzimanaesdras2_db_user`
- **Password:** `VDjcotwlaT0l65Bc`
- **IP Address:** `129.222.149.116`
- **Connection String:** `mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0`
- **Database:** `dream_decol`

## 🚀 Migration Options

You have several options to migrate your data:

### Option 1: Automated Migration Script (Recommended)

Use the Node.js migration script that handles everything automatically:

```bash
# Run full migration (backup + export + migrate + verify)
node scripts/atlasMigration.js --full

# Or run individual steps:
node scripts/atlasMigration.js --backup     # Create backup
node scripts/atlasMigration.js --export     # Export to JSON
node scripts/atlasMigration.js --migrate    # Migrate to Atlas
node scripts/atlasMigration.js --verify     # Verify migration
```

### Option 2: MongoDB Command Line Tools

Use the provided scripts for MongoDB command-line operations:

#### Windows:
```cmd
# Test connection
scripts\atlas-commands.bat connect

# Backup local to Atlas
scripts\atlas-commands.bat dump

# Import JSON files to Atlas
scripts\atlas-commands.bat import

# Export from Atlas to JSON
scripts\atlas-commands.bat export

# Show database status
scripts\atlas-commands.bat status
```

#### Linux/macOS:
```bash
# Make script executable (first time only)
chmod +x scripts/atlas-commands.sh

# Test connection
./scripts/atlas-commands.sh connect

# Backup local to Atlas
./scripts/atlas-commands.sh dump

# Import JSON files to Atlas
./scripts/atlas-commands.sh import

# Export from Atlas to JSON
./scripts/atlas-commands.sh export

# Show database status
./scripts/atlas-commands.sh status
```

### Option 3: Manual MongoDB Commands

If you prefer to run MongoDB commands manually:

#### Test Connection:
```bash
mongosh "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0"
```

#### Backup (mongodump):
```bash
mongodump --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --db dream_decol --out ./backup
```

#### Restore (mongorestore):
```bash
mongorestore --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --db dream_decol ./backup/dream_decol
```

#### Import JSON files:
```bash
mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection products --type JSON --file products.json --upsert

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection productratings --type JSON --file productratings.json --upsert

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection bookings --type JSON --file bookings.json --upsert

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection contactmessages --type JSON --file contactmessages.json --upsert

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection adminusers --type JSON --file adminusers.json --upsert

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection activities --type JSON --file activities.json --upsert
```

## 📋 Step-by-Step Migration Process

### Step 1: Prepare Your Environment

1. **Install MongoDB Database Tools** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/database-tools
   - Make sure `mongodump`, `mongorestore`, and `mongoimport` are in your PATH

2. **Test Atlas Connection**:
   ```bash
   # Using the migration script
   node scripts/atlasMigration.js --verify
   
   # Or using the batch/shell script
   scripts/atlas-commands.bat connect
   ```

### Step 2: Choose Migration Method

#### Method A: Full Automated Migration
```bash
node scripts/atlasMigration.js --full
```
This will:
- Create a backup of your local database
- Export data to JSON files
- Migrate all collections to Atlas
- Verify the migration was successful

#### Method B: Manual Migration
1. **Backup your local database first:**
   ```bash
   mongodump --uri "mongodb://localhost:27017/dream_decol" --out ./local_backup
   ```

2. **Export collections to JSON:**
   ```bash
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection products --out products.json
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection productratings --out productratings.json
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection bookings --out bookings.json
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection contactmessages --out contactmessages.json
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection adminusers --out adminusers.json
   mongoexport --uri "mongodb://localhost:27017/dream_decol" --collection activities --out activities.json
   ```

3. **Import to Atlas:**
   ```bash
   # Use the batch script
   scripts/atlas-commands.bat import
   
   # Or manually for each collection
   mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --collection products --type JSON --file products.json --upsert
   ```

### Step 3: Update Application Configuration

1. **Update your .env file:**
   ```bash
   # Copy the atlas configuration
   cp .env.atlas .env
   
   # Or manually update MONGODB_URI in .env:
   MONGODB_URI=mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0
   ```

2. **Update .env.example** (already done):
   The `.env.example` file now includes the Atlas connection string as the default.

### Step 4: Test Your Application

1. **Start your application:**
   ```bash
   npm start
   # or
   node server.js
   ```

2. **Test database connectivity:**
   ```bash
   # Check if the server starts without database errors
   # Test API endpoints to ensure they work with Atlas
   ```

3. **Verify data integrity:**
   ```bash
   # Use the status command to check data counts
   scripts/atlas-commands.bat status
   ```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Connection Timeout:**
   - Check your internet connection
   - Ensure MongoDB Atlas IP whitelist includes your IP address
   - Verify the connection string is correct

2. **Authentication Failed:**
   - Double-check username and password
   - Ensure the database name is correct
   - Check if the user has proper permissions

3. **Import Errors:**
   - Ensure JSON files are valid
   - Check that collections exist in the source database
   - Verify you have write permissions on Atlas

4. **Script Permission Errors (Linux/macOS):**
   ```bash
   chmod +x scripts/atlas-commands.sh
   ```

### Verification Commands

Check migration success:

```bash
# Using the migration script
node scripts/atlasMigration.js --verify

# Using the command scripts
scripts/atlas-commands.bat status

# Manual verification
mongosh "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/?appName=Cluster0" --eval "
print('Database: ' + db.getName());
print('Collections:');
db.getCollectionNames().forEach(function(collection) {
    if (!collection.startsWith('system.')) {
        const count = db[collection].countDocuments();
        print('  - ' + collection + ': ' + count + ' documents');
    }
});
"
```

## 📁 File Structure

After migration, you'll have:

```
project/
├── scripts/
│   ├── atlasMigration.js      # Node.js migration script
│   ├── atlas-commands.sh      # Linux/macOS command script
│   └── atlas-commands.bat     # Windows command script
├── .env.atlas                 # Atlas configuration template
├── migration_backup/          # Backup directory (created automatically)
├── migration_json/           # JSON export directory (created automatically)
└── *.json                    # Collection export files
```

## 🆘 Emergency Recovery

If something goes wrong during migration:

1. **Restore from backup:**
   ```bash
   mongorestore --uri "mongodb://localhost:27017/dream_decol" ./local_backup/dream_decol
   ```

2. **Check logs:** Look for error messages in the migration script output

3. **Manual verification:** Connect to both databases and compare document counts

4. **Contact support:** If issues persist, check MongoDB Atlas documentation or contact support

## ✅ Success Checklist

- [ ] Atlas connection test successful
- [ ] Local backup created
- [ ] Data exported to JSON files
- [ ] All collections migrated to Atlas
- [ ] Document counts match between local and Atlas
- [ ] Application connects to Atlas successfully
- [ ] API endpoints working with Atlas
- [ ] .env file updated with Atlas URI
- [ ] .env.example updated with Atlas URI

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Ensure MongoDB Atlas IP whitelist includes your IP
4. Check MongoDB Atlas dashboard for any alerts or issues

---

**Note:** Always backup your data before migration. The migration scripts create automatic backups, but it's good practice to have additional backups.