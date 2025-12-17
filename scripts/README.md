# Database Seeding Instructions

## Overview
This script seeds your MongoDB database with sample products that include ratings and review counts.

## Prerequisites
- Node.js installed
- MongoDB Atlas connection string configured in `.env` file
- MongoDB Node.js driver installed (included in dependencies)

## Configuration

1. Ensure your `.env` file has the correct MongoDB connection string:
```
MONGODB_URI=mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/dream_decol?retryWrites=true&w=majority
```

## Running the Seeder

### Method 1: Using Node.js
```bash
cd backend
node scripts/seedProductsWithRatings.js
```

### Method 2: Using npm script (recommended)
Add this to your `backend/package.json` scripts:
```json
"scripts": {
  "seed": "node scripts/seedProductsWithRatings.js"
}
```

Then run:
```bash
cd backend
npm run seed
```

## What the Seeder Does

1. **Connects to MongoDB**: Uses the connection string from `.env`
2. **Clears existing data**: Deletes all products from the database
3. **Inserts sample products**: Adds 8 products with:
   - Ratings (3.5 to 5.0)
   - Review counts (2 to 20)
   - All product details (images, descriptions, etc.)
4. **Closes connection**: Gracefully shuts down the connection

## Sample Products Included

| Product | Rating | Reviews |
|---------|--------|---------|
| Luna Velvet Sofa | 4.8 | 12 |
| Aurora Dining Table | 4.5 | 8 |
| Serene Bed Frame | 5.0 | 20 |
| Noir Executive Desk | 4.2 | 5 |
| Haven Lounge Chair | 4.7 | 15 |
| Terra Outdoor Sofa | 4.9 | 7 |
| Oslo Sideboard | 4.0 | 3 |
| Drift Coffee Table | 3.5 | 2 |

## After Seeding

- Ratings will appear on:
  - Home page (Featured Products section)
  - Product cards in the shop
  - Product detail pages
  - Admin product form (editable)

## Troubleshooting

**Connection issues?**
- Verify your MongoDB Atlas connection string
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure the database name `dream_decol` exists

**Permission issues?**
- Make sure the database user has read/write permissions
- The user `nsanzimanaesdras2_db_user` should have proper access

## MongoDB Atlas Commands

If you need to manually manage the database:

**Backup:**
```bash
mongodump --uri mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/dream_decol
```

**Restore:**
```bash
mongorestore --uri mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net
```

**Import JSON:**
```bash
mongoimport --uri mongodb+srv://nsanzimanaesdras2_db_user:<password>@cluster0.1jag5yi.mongodb.net/<database> --collection <collection> --type JSON --file <file.json>
```
