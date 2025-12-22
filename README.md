# Dream Decol Backend API

A comprehensive Node.js/Express backend for the Dream Decol furniture showcase website with guest product rating system.

## 🚀 Features

- **Product Management**: Complete CRUD operations for furniture products
- **Guest Rating System**: IP-based product ratings without authentication
- **Admin Authentication**: Secure admin panel access
- **Booking System**: Customer booking management
- **Contact Management**: Customer inquiry handling
- **File Uploads**: Product image management
- **MongoDB Integration**: Scalable data storage with Atlas
- **RESTful API**: Clean, standardized endpoints
- **CORS Enabled**: Frontend framework compatibility

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Management](#database-management)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## 🛠 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Setup

1. **Clone and install dependencies:**
```bash
cd dream_decol_backend
npm install
```

2. **Environment Configuration:**
Copy `.env.example` to `.env` and configure:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dream_decol

# JWT Configuration
JWT_SECRET=your-secret-key-for-dream-decol
JWT_EXPIRE=1d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# CORS Configuration
CORS_ORIGIN=*
```

3. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

---

## ⚙️ Configuration

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Whitelist your IP address or use `0.0.0.0/0` for development
3. Create a database user with read/write permissions
4. Get your connection string and add it to `.env`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRE` | JWT token expiration | Yes |
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No |
| `CORS_ORIGIN` | Allowed CORS origins | No |

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Admin Endpoints
Admin endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Products
- `GET /api/products` - Get all products (public)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get product categories
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/:id/related` - Get related products
- `POST /api/products/admin` - Create product (admin)
- `PUT /api/products/admin/:id` - Update product (admin)
- `DELETE /api/products/admin/:id` - Delete product (admin)

#### Admin Management
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile

#### Booking System
- `POST /api/booking` - Create booking
- `GET /api/booking` - Get all bookings (admin)
- `PUT /api/booking/:id` - Update booking (admin)
- `DELETE /api/booking/:id` - Delete booking (admin)

#### Contact Messages
- `POST /api/contact` - Submit contact message
- `GET /api/contact` - Get all messages (admin)
- `PUT /api/contact/:id` - Update message (admin)
- `DELETE /api/contact/:id` - Delete message (admin)

### 🌟 Guest Product Rating System

A comprehensive rating system allowing customers to rate products without creating accounts.

#### Rating Endpoints

**Submit a Rating**
```http
POST /api/ratings
Content-Type: application/json

{
  "productId": "64f7a8b2c9d4e1f3a2b4c5d6",
  "rating": 5
}
```

**Get Product Ratings**
```http
GET /api/ratings/:productId
```

**Get Detailed Statistics**
```http
GET /api/ratings/:productId/stats
```

#### Rating Features

- **IP-based Prevention**: Each IP can rate each product only once
- **Validation**: Ratings must be integers between 1-5
- **Statistics**: Average ratings, distribution, and recent ratings
- **Privacy**: IP addresses secured, user agents not exposed

#### Example Response
```json
{
  "success": true,
  "data": {
    "productId": "64f7a8b2c9d4e1f3a2b4c5d6",
    "productTitle": "Modern Sectional Sofa",
    "averageRating": 4.2,
    "totalRatings": 15,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 5,
      "5": 7
    },
    "recentRatings": [...]
  }
}
```

#### Frontend Integration

**JavaScript Example:**
```javascript
// Submit rating
async function submitRating(productId, rating) {
  const response = await fetch('/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, rating })
  });
  return response.json();
}

// Get ratings
async function getProductRatings(productId) {
  const response = await fetch(`/api/ratings/${productId}`);
  return response.json();
}
```

**React Component:**
```jsx
function ProductRating({ productId }) {
  const [rating, setRating] = useState(0);
  
  const handleRating = async (value) => {
    const result = await submitRating(productId, value);
    if (result.success) setRating(value);
  };
  
  return (
    <div>
      {[1,2,3,4,5].map(star => (
        <button key={star} onClick={() => handleRating(star)}>
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
```

---

## 🗄 Database Management

### Database Seeding

Seed your database with sample products:

```bash
# Method 1: Direct node execution
node scripts/seedProducts.js

# Method 2: Using npm command (recommended)
npm run seed
```

### Database Cleanup

Clear all data from the database (preserves admin users):

```bash
# Method 1: Direct node execution
node scripts/clearDatabase.js

# Method 2: Using npm command (recommended)
npm run clear:db
```

⚠️ **Warning**: This will delete ALL data except admin users. The script requires confirmation.

#### What the Seeder Does:
1. **Connects to MongoDB** using `.env` configuration
2. **Clears existing data** from products collection
3. **Inserts sample products** with realistic data:
   - Random furniture names and descriptions
   - Fake images from Unsplash
   - Realistic pricing and dimensions
   - Various categories (living-room, bedroom, dining, etc.)
   - Stock quantities and availability flags

#### Sample Products Include:
- Diverse product categories
- Realistic pricing ($10-$1000)
- Multiple materials and dimensions
- Stock quantities
- Featured flags for some products

#### Product Data Structure:
Each product includes:
- Title and SKU
- Price and currency
- Short and full descriptions
- Dimensions (width, depth, height)
- Materials list
- Main image and additional images
- Optional video URL
- Tags for searchability
- Category classification
- Stock availability and quantities
- SEO metadata
- Creation and update timestamps

### Database Migration

Migrate data from local MongoDB to Atlas:

```bash
# Basic migration
node scripts/migrateToAtlas.js

# With options
node scripts/migrateToAtlas.js --drop --yes --regen-ids

# From specific local URI
node scripts/migrateToAtlas.js --local mongodb://localhost:27017/dreamdecol
```

#### Migration Options:
- `--drop` - Drop collections on target first
- `--yes` - Skip confirmation prompts
- `--regen-ids` - Generate new ObjectIds
- `--skip <collections>` - Skip specific collections
- `--local <uri>` - Specify local MongoDB URI

#### Database Cleanup Utility

The `clearDatabase.js` script safely removes all data while preserving admin users:

**What it deletes:**
- All products
- All product ratings
- All bookings
- All contact messages
- All activity logs

**What it preserves:**
- All admin users and their credentials
- Database structure and indexes

**Safety Features:**
- Requires typed confirmation ("CLEAR")
- Shows admin user count before and after
- Provides detailed cleanup summary
- Optimizes database indexes after cleanup
- Handles connection errors gracefully

### Manual Database Operations

#### MongoDB CLI Commands

**Backup:**
```bash
mongodump --uri "mongodb+srv://username:password@cluster.mongodb.net/dream_decol"
```

**Restore:**
```bash
mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net"
```

**Import JSON:**
```bash
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/dream_decol" --collection products --type json --file products.json
```

---

## 🚀 Deployment

### Render Deployment

1. **MongoDB Atlas Network Access:**
   - Add Render outbound IPs to Atlas IP whitelist
   - IP: `129.222.149.116` (or use `0.0.0.0/0` for testing)

2. **Environment Variables:**
   In Render dashboard, set:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dream_decol?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-production-secret
   NODE_ENV=production
   ```

3. **Deployment Notes:**
   - Do NOT commit credentials to repository
   - Use Render environment variables
   - Redeploy after setting variables
   - Allow 5-10 minutes for Atlas network changes

### Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas IP whitelist updated
- [ ] JWT secret changed from default
- [ ] CORS origins restricted to your domain
- [ ] File upload limits configured
- [ ] Database indexes optimized
- [ ] SSL certificate configured
- [ ] Monitoring and logging set up

---

## 📁 Project Structure

```
dream_decol_backend/
├── .env                    # Environment configuration
├── .env.example           # Environment template
├── server.js              # Main server file
├── db.js                  # Database connection
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
├── middleware/            # Custom middleware
│   └── auth.js           # Authentication middleware
├── models/               # Mongoose models
│   ├── Product.js        # Product model
│   ├── ProductRating.js  # Rating model
│   ├── AdminUser.js      # Admin user model
│   ├── Booking.js        # Booking model
│   ├── ContactMessage.js # Contact model
│   └── Activity.js       # Activity log model
├── routes/               # API route handlers
│   ├── productRoutes.js  # Product endpoints
│   ├── ratingRoutes.js   # Rating endpoints
│   ├── adminUserRoutes.js # Admin endpoints
│   ├── bookingRoutes.js  # Booking endpoints
│   ├── contactMessageRoutes.js # Contact endpoints
│   └── activityRoutes.js # Activity endpoints
├── scripts/              # Utility scripts
│   ├── migrateToAtlas.js # Database migration
│   └── seedProducts.js   # Database seeding
└── uploads/              # File upload directory
```

---

## 🛡 Security Features

### Authentication & Authorization
- JWT-based admin authentication
- Protected admin routes
- Role-based access control

### Data Validation
- Input validation on all endpoints
- MongoDB ObjectId validation
- File type and size restrictions
- SQL injection prevention

### Security Headers
- CORS configuration
- XSS protection
- Rate limiting ready

### Privacy Protection
- IP addresses secured in rating system
- User agents not exposed in responses
- Sensitive data handling guidelines

---

## 🧪 Testing

### API Testing Examples

**Test Product Rating:**
```bash
# Valid rating submission
curl -X POST http://localhost:5000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"productId":"64f7a8b2c9d4e1f3a2b4c5d6","rating":5}'

# Invalid rating (out of range)
curl -X POST http://localhost:5000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"productId":"64f7a8b2c9d4e1f3a2b4c5d6","rating":6}'

# Get product ratings
curl -X GET http://localhost:5000/api/ratings/64f7a8b2c9d4e1f3a2b4c5d6
```

**Test Product Management:**
```bash
# Get all products
curl -X GET http://localhost:5000/api/products

# Get featured products
curl -X GET http://localhost:5000/api/products/featured

# Get product categories
curl -X GET http://localhost:5000/api/products/categories
```

---

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Issues:**
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user permissions

**File Upload Issues:**
- Check `MAX_FILE_SIZE` environment variable
- Verify `ALLOWED_FILE_TYPES` configuration
- Ensure `uploads` directory exists and is writable

**Authentication Issues:**
- Verify `JWT_SECRET` is set
- Check token expiration time
- Ensure proper Authorization header format

**CORS Issues:**
- Configure `CORS_ORIGIN` environment variable
- Check frontend domain configuration

### Performance Optimization

- MongoDB indexes are configured for optimal query performance
- Rating system uses aggregation pipelines for statistics
- File uploads are limited and validated
- Database connections are pooled

---

## 📝 API Error Responses

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error details"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## 🎯 Features Overview

### ✅ Implemented Features
- [x] Complete product management system
- [x] Guest product rating system with IP-based prevention
- [x] Admin authentication and authorization
- [x] Booking management system
- [x] Contact message handling
- [x] File upload management
- [x] Activity logging
- [x] Database seeding and migration tools
- [x] RESTful API design
- [x] CORS enabled for frontend compatibility
- [x] Comprehensive error handling
- [x] Input validation and sanitization
- [x] MongoDB Atlas integration
- [x] Deployment-ready configuration

### 🚀 Ready for Enhancement
- [ ] Rate limiting implementation
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Product recommendations
- [ ] Analytics dashboard
- [ ] API versioning
- [ ] WebSocket integration for real-time updates

---

## 📄 License

This project is proprietary software for Dream Decol furniture store.

---

## 🤝 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Verify environment configuration
- Test with provided examples

---

**Built with ❤️ for Dream Decol Furniture Store**