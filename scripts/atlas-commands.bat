@echo off
REM MongoDB Atlas Migration Commands for Windows
REM This script contains all the MongoDB command-line operations for migrating to Atlas

echo 🚀 MongoDB Atlas Migration Commands
echo ==================================

REM Configuration
set ATLAS_USERNAME=nsanzimanaesdras2_db_user
set ATLAS_PASSWORD=VDjcotwlaT0l65Bc
set ATLAS_CLUSTER=cluster0.1jag5yi.mongodb.net
set DATABASE_NAME=dream_decol
set ATLAS_URI=mongodb+srv://%ATLAS_USERNAME%:%ATLAS_PASSWORD%@%ATLAS_CLUSTER%/?appName=Cluster0

echo Database: %DATABASE_NAME%
echo Cluster: %ATLAS_CLUSTER%
echo.

REM Function to show usage
if "%1"=="help" goto :show_usage
if "%1"=="" goto :show_usage
if "%1"=="?" goto :show_usage

goto :%1

:show_usage
echo Usage: %0 [command]
echo.
echo Commands:
echo   dump        - Backup local database to MongoDB Atlas
echo   restore     - Restore database from Atlas to local
echo   import      - Import JSON files to Atlas
echo   export      - Export collections to JSON files
echo   connect     - Test connection to Atlas
echo   status      - Show database status
echo   help        - Show this help message
echo.
echo Examples:
echo   %0 dump              # Backup local to Atlas
echo   %0 import            # Import JSON files to Atlas
echo   %0 connect           # Test Atlas connection
goto :end

:connect
echo 🔗 Testing connection to MongoDB Atlas...
mongosh "%ATLAS_URI%" --eval "try { const result = db.runCommand({ ping: 1 }); if (result.ok === 1) { print('✅ Successfully connected to MongoDB Atlas'); print('📊 Database: ' + db.getName()); print('📋 Collections: ' + db.getCollectionNames().join(', ')); } else { print('❌ Connection failed'); process.exit(1); } } catch (error) { print('❌ Connection error: ' + error.message); process.exit(1); }"
goto :end

:dump
echo 📦 Backing up local database to MongoDB Atlas...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%" & set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "stamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "backup_dir=backup_%stamp%"

mongodump --uri "%ATLAS_URI%" --db "%DATABASE_NAME%" --out "%backup_dir%"
if %errorlevel% equ 0 (
    echo ✅ Backup completed successfully
) else (
    echo ❌ Backup failed
)
goto :end

:restore
echo 📥 Restoring database from MongoDB Atlas to local...
echo Please specify backup directory:
set /p backup_dir="Backup directory: "
mongorestore --uri "mongodb://localhost:27017" --db "%DATABASE_NAME%" "%backup_dir%\%DATABASE_NAME%"
if %errorlevel% equ 0 (
    echo ✅ Restore completed successfully
) else (
    echo ❌ Restore failed
)
goto :end

:import
echo 📤 Importing JSON files to MongoDB Atlas...
echo Importing products...
if exist products.json mongoimport --uri "%ATLAS_URI%" --collection products --type JSON --file products.json --upsert

echo Importing productratings...
if exist productratings.json mongoimport --uri "%ATLAS_URI%" --collection productratings --type JSON --file productratings.json --upsert

echo Importing bookings...
if exist bookings.json mongoimport --uri "%ATLAS_URI%" --collection bookings --type JSON --file bookings.json --upsert

echo Importing contactmessages...
if exist contactmessages.json mongoimport --uri "%ATLAS_URI%" --collection contactmessages --type JSON --file contactmessages.json --upsert

echo Importing adminusers...
if exist adminusers.json mongoimport --uri "%ATLAS_URI%" --collection adminusers --type JSON --file adminusers.json --upsert

echo Importing activities...
if exist activities.json mongoimport --uri "%ATLAS_URI%" --collection activities --type JSON --file activities.json --upsert

echo ✅ Import process completed
goto :end

:export
echo 📄 Exporting collections from MongoDB Atlas to JSON files...
mongoexport --uri "%ATLAS_URI%" --collection products --out products_atlas.json
mongoexport --uri "%ATLAS_URI%" --collection productratings --out productratings_atlas.json
mongoexport --uri "%ATLAS_URI%" --collection bookings --out bookings_atlas.json
mongoexport --uri "%ATLAS_URI%" --collection contactmessages --out contactmessages_atlas.json
mongoexport --uri "%ATLAS_URI%" --collection adminusers --out adminusers_atlas.json
mongoexport --uri "%ATLAS_URI%" --collection activities --out activities_atlas.json
echo ✅ Export process completed
goto :end

:status
echo 📊 Database Status
echo ==================
mongosh "%ATLAS_URI%" --eval "print('Database: ' + db.getName()); print('Collections:'); db.getCollectionNames().forEach(function(collection) { if (!collection.startsWith('system.')) { const count = db[collection].countDocuments(); print('  - ' + collection + ': ' + count + ' documents'); } });"
goto :end

:end