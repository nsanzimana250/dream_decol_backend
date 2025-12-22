#!/bin/bash

# MongoDB Atlas Migration Commands
# This script contains all the MongoDB command-line operations for migrating to Atlas

echo "🚀 MongoDB Atlas Migration Commands"
echo "=================================="

# Configuration
ATLAS_USERNAME="nsanzimanaesdras2_db_user"
ATLAS_PASSWORD="VDjcotwlaT0l65Bc"
ATLAS_CLUSTER="cluster0.1jag5yi.mongodb.net"
DATABASE_NAME="dream_decol"
ATLAS_URI="mongodb+srv://${ATLAS_USERNAME}:${ATLAS_PASSWORD}@${ATLAS_CLUSTER}/?appName=Cluster0"

echo "Database: ${DATABASE_NAME}"
echo "Cluster: ${ATLAS_CLUSTER}"
echo ""

# Function to display usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dump        - Backup local database to MongoDB Atlas"
    echo "  restore     - Restore database from Atlas to local"
    echo "  import      - Import JSON files to Atlas"
    echo "  export      - Export collections to JSON files"
    echo "  connect     - Test connection to Atlas"
    echo "  status      - Show database status"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dump              # Backup local to Atlas"
    echo "  $0 import            # Import JSON files to Atlas"
    echo "  $0 connect           # Test Atlas connection"
}

# Function to test Atlas connection
test_connection() {
    echo "🔗 Testing connection to MongoDB Atlas..."
    
    mongosh "${ATLAS_URI}" --eval "
        try {
            const result = db.runCommand({ ping: 1 });
            if (result.ok === 1) {
                print('✅ Successfully connected to MongoDB Atlas');
                print('📊 Database: ' + db.getName());
                print('📋 Collections: ' + db.getCollectionNames().join(', '));
            } else {
                print('❌ Connection failed');
                process.exit(1);
            }
        } catch (error) {
            print('❌ Connection error: ' + error.message);
            process.exit(1);
        }
    "
}

# Function to backup (dump) to Atlas
backup_to_atlas() {
    echo "📦 Backing up local database to MongoDB Atlas..."
    
    mongodump --uri "${ATLAS_URI}" --db "${DATABASE_NAME}" --out "./backup_$(date +%Y%m%d_%H%M%S)"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completed successfully"
    else
        echo "❌ Backup failed"
        exit 1
    fi
}

# Function to restore from Atlas
restore_from_atlas() {
    echo "📥 Restoring database from MongoDB Atlas to local..."
    
    mongorestore --uri "mongodb://localhost:27017" --db "${DATABASE_NAME}" "./backup_$(date +%Y%m%d_%H%M%S)/${DATABASE_NAME}"
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore completed successfully"
    else
        echo "❌ Restore failed"
        exit 1
    fi
}

# Function to import JSON files to Atlas
import_to_atlas() {
    echo "📤 Importing JSON files to MongoDB Atlas..."
    
    collections=("products" "productratings" "bookings" "contactmessages" "adminusers" "activities")
    
    for collection in "${collections[@]}"; do
        if [ -f "${collection}.json" ]; then
            echo "Importing ${collection}.json..."
            mongoimport --uri "${ATLAS_URI}" --collection "${collection}" --type JSON --file "${collection}.json" --upsert
            
            if [ $? -eq 0 ]; then
                echo "✅ Imported ${collection} successfully"
            else
                echo "⚠️ Import failed for ${collection} (may not exist)"
            fi
        else
            echo "ℹ️ ${collection}.json not found, skipping..."
        fi
    done
}

# Function to export collections to JSON
export_from_atlas() {
    echo "📄 Exporting collections from MongoDB Atlas to JSON files..."
    
    collections=("products" "productratings" "bookings" "contactmessages" "adminusers" "activities")
    
    for collection in "${collections[@]}"; do
        echo "Exporting ${collection}..."
        mongoexport --uri "${ATLAS_URI}" --collection "${collection}" --out "${collection}_atlas.json"
        
        if [ $? -eq 0 ]; then
            echo "✅ Exported ${collection} successfully"
        else
            echo "⚠️ Export failed for ${collection} (may not exist)"
        fi
    done
}

# Function to show database status
show_status() {
    echo "📊 Database Status"
    echo "=================="
    
    mongosh "${ATLAS_URI}" --eval "
        print('Database: ' + db.getName());
        print('Collections:');
        db.getCollectionNames().forEach(function(collection) {
            if (!collection.startsWith('system.')) {
                const count = db[collection].countDocuments();
                print('  - ' + collection + ': ' + count + ' documents');
            }
        });
    "
}

# Main script logic
case "${1:-help}" in
    "dump"|"backup")
        backup_to_atlas
        ;;
    "restore")
        restore_from_atlas
        ;;
    "import")
        import_to_atlas
        ;;
    "export")
        export_from_atlas
        ;;
    "connect")
        test_connection
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_usage
        ;;
esac