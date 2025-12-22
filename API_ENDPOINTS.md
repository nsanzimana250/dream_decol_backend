# Dream Decol API - Complete Endpoint Documentation

## 🔐 Authentication System

### Admin Authentication (JWT Token Required)

**Base URL:** `http://localhost:5000/api/admin`

### Login
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f7a8b2c9d4e1f3a2b4c5d6",
    "username": "admin",
    "role": "superadmin"
  }
}
```

---

## 👥 Admin User Management (CRUD Operations)

### Get All Admin Users
```http
GET /api/admin/users
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "users": [
    {
      "_id": "64f7a8b2c9d4e1f3a2b4c5d6",
      "username": "admin",
      "role": "superadmin",
      "isActive": true,
      "createdAt": "2025-12-22T09:26:00.000Z"
    }
  ]
}
```

### Get Single Admin User
```http
GET /api/admin/users/:id
Authorization: Bearer <your-jwt-token>
```

### Create New Admin User (SuperAdmin Only)
```http
POST /api/admin/auth/register
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "username": "newadmin",
  "password": "password123",
  "role": "admin"
}
```

### Update Admin User
```http
PUT /api/admin/users/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "username": "updatedadmin",
  "password": "newpassword123",
  "role": "admin",
  "isActive": true
}
```

### Delete Admin User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Get Current User Profile
```http
GET /api/admin/auth/me
Authorization: Bearer <your-jwt-token>
```

---

## 🛍️ Product Management

### Public Endpoints (No Authentication Required)

#### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `page=1` - Page number
- `limit=12` - Items per page
- `q=search` - Search query
- `category=living-room` - Filter by category
- `sort=price-asc|price-desc|name|newest` - Sort results

#### Get Featured Products
```http
GET /api/products/featured
```

#### Get Product Categories
```http
GET /api/products/categories
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Get Related Products
```http
GET /api/products/:id/related
```

### Admin Endpoints (Authentication Required)

#### Get All Products (Admin)
```http
GET /api/products/admin
Authorization: Bearer <your-jwt-token>
```

#### Create Product
```http
POST /api/products/admin
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Modern Sectional Sofa",
  "sku": "SOFA-001",
  "price": 1299.99,
  "currency": "RWF",
  "shortDescription": "Comfortable modern sectional sofa",
  "description": "A beautiful modern sectional sofa perfect for living rooms...",
  "category": "living-room",
  "mainImage": "https://example.com/sofa.jpg",
  "dimensions": {
    "width": "200cm",
    "depth": "150cm", 
    "height": "80cm"
  },
  "materials": ["Leather", "Wood"],
  "inStock": true,
  "stockQuantity": 5,
  "featured": true
}
```

#### Update Product
```http
PUT /api/products/admin/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Updated Product Title",
  "price": 1199.99,
  "inStock": false
}
```

#### Delete Product
```http
DELETE /api/products/admin/:id
Authorization: Bearer <your-jwt-token>
```

---

## ⭐ Guest Rating System

### Submit Product Rating (No Authentication)
```http
POST /api/ratings
Content-Type: application/json

{
  "productId": "64f7a8b2c9d4e1f3a2b4c5d6",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "rating": {
    "id": "64f8b9c3d0e5f2g4h3i6j7k",
    "productId": "64f7a8b2c9d4e1f3a2b4c5d6",
    "rating": 5,
    "createdAt": "2025-12-22T09:26:00.000Z"
  }
}
```

### Get Product Ratings
```http
GET /api/ratings/:productId
```

**Response:**
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

### Get Detailed Rating Statistics
```http
GET /api/ratings/:productId/stats
```

---

## 📅 Booking Management

### Create Booking (No Authentication)
```http
POST /api/booking
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "date": "2025-12-25",
  "time": "14:00",
  "serviceType": "consultation",
  "notes": "Looking for living room furniture"
}
```

### Admin Booking Management
```http
GET /api/booking
Authorization: Bearer <your-jwt-token>
```

```http
PUT /api/booking/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

```http
DELETE /api/booking/:id
Authorization: Bearer <your-jwt-token>
```

---

## 📧 Contact Management

### Submit Contact Message (No Authentication)
```http
POST /api/contact
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-0124",
  "message": "I'm interested in your bedroom furniture collection. Can you provide more details?"
}
```

### Admin Contact Management
```http
GET /api/contact
Authorization: Bearer <your-jwt-token>
```

```http
PUT /api/contact/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "status": "replied"
}
```

```http
DELETE /api/contact/:id
Authorization: Bearer <your-jwt-token>
```

---

## 📊 Activity Logging

### Get Public Activities
```http
GET /api/activities
```

### Admin Activity Management
```http
GET /api/admin/activities
Authorization: Bearer <your-jwt-token>
```

---

## 🔒 Authentication Levels

### Public Access (No Token Required)
- Product browsing
- Guest ratings
- Booking creation
- Contact form submission
- Viewing activities

### Admin Access (JWT Token Required)
- All CRUD operations on products
- Admin user management
- Booking management
- Contact message management
- Activity monitoring

### SuperAdmin Access (JWT Token Required)
- Create new admin users
- All admin privileges

---

## 🛡️ Security Features

### JWT Token Authentication
- Secure token-based authentication
- Automatic token expiration
- Role-based access control

### Input Validation
- All inputs validated using express-validator
- SQL injection prevention
- XSS protection

### Rate Limiting Ready
- Structure in place for rate limiting implementation

### Error Handling
- Consistent error response format
- Detailed validation error messages
- Proper HTTP status codes

---

## 📱 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
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

### Pagination Response
```json
{
  "success": true,
  "products": [...],
  "pagination": {
    "current": 1,
    "total": 5,
    "count": 12,
    "totalCount": 60
  }
}
```

---

## 🚀 Live API

**Base URL:** https://dream-decol-backend.onrender.com

**Available Endpoints:**
- Products: `/api/products`
- Ratings: `/api/ratings`
- Booking: `/api/booking`
- Contact: `/api/contact`
- Admin: `/api/admin`

Your Dream Decol furniture API is fully operational with complete CRUD functionality for both admin users and public access!