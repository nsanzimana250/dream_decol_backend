# Dynamic Configuration System

## Overview

This document describes the dynamic configuration system implemented to replace all static data with database-driven configurations. All system settings, enums, and options are now stored in the database and can be modified through the API or administration interface.

## What Was Changed

### Static Data Eliminated

1. **Product Categories** - Previously hardcoded enum in Product model
2. **Product Currencies** - Previously hardcoded enum in Product model
3. **Product Materials** - Previously hardcoded array in seed script
4. **Booking Time Slots** - Previously hardcoded enum in Booking model
5. **Booking Service Types** - Previously hardcoded enum in Booking model
6. **Booking Statuses** - Previously hardcoded enum in Booking model
7. **Admin User Roles** - Previously hardcoded enum in AdminUser model
8. **System Settings** - Various hardcoded values (file sizes, CORS origins, etc.)
9. **Default Admin User** - Previously auto-created with hardcoded credentials
10. **Error Messages** - Static response messages throughout routes

## New Dynamic System

### Configuration Model

The `Configuration` model stores all system settings in the database:

```javascript
{
  key: 'product.categories',           // Unique configuration key
  value: ['living-room', 'bedroom'],   // Configuration value (can be any type)
  description: 'Available product categories',
  category: 'product',                 // Configuration category
  isActive: true,                      // Whether config is active
  createdAt: Date,
  updatedAt: Date
}
```

### Configuration Categories

- **product** - Product-related configurations
- **booking** - Booking system configurations
- **user** - User management configurations
- **system** - System-level configurations
- **localization** - Language and regional settings

### API Endpoints

#### Admin Endpoints (Authentication Required)

- `GET /api/config` - Get all configurations
- `GET /api/config/:key` - Get specific configuration
- `PUT /api/config/:key` - Update configuration
- `POST /api/config` - Create new configuration
- `DELETE /api/config/:key` - Delete configuration
- `GET /api/config/public/:category` - Get public configurations by category

## Configuration Management

### Using Configuration in Code

#### Getting Configuration Values

```javascript
// In models
const categories = await Product.getAvailableCategories();
const currencies = await Product.getAvailableCurrencies();
const timeSlots = await Booking.getAvailableTimeSlots();
const roles = await AdminUser.getAvailableRoles();

// Direct Configuration access
const Configuration = require('./models/Configuration');
const categories = await Configuration.getConfig('product.categories', []);
```

#### Setting Configuration Values

```javascript
// Set new categories
await Configuration.setConfig('product.categories', ['new-category-1', 'new-category-2'], {
  description: 'Updated product categories',
  category: 'product'
});

// Update existing configuration
await Configuration.setConfig('booking.timeSlots', ['08:00', '09:00', '10:00']);
```

### Dynamic Model Methods

#### Product Model
- `Product.getAvailableCategories()` - Returns array of available categories
- `Product.getAvailableCurrencies()` - Returns array of available currencies
- `Product.getDefaultCurrency()` - Returns default currency
- `Product.searchProducts(query, options)` - Search with dynamic filtering

#### Booking Model
- `Booking.getAvailableTimeSlots()` - Returns array of time slots
- `Booking.getAvailableServiceTypes()` - Returns array of service types
- `Booking.getAvailableStatuses()` - Returns array of booking statuses

#### AdminUser Model
- `AdminUser.getAvailableRoles()` - Returns array of available roles
- `AdminUser.getDefaultRole()` - Returns default admin role

## Setup and Initialization

### 1. Initialize Default Configurations

```bash
node scripts/initializeConfigurations.js
```

This script creates all default system configurations in the database.

### 2. Setup Admin User

```bash
node scripts/setupAdminUser.js
```

Interactive script to create admin users with dynamic validation.

### 3. Test Dynamic System

```bash
node scripts/testDynamicConfiguration.js
```

Comprehensive test to verify all dynamic functionality works correctly.

### 4. Seed Products (Updated)

```bash
node scripts/seedProducts.js
```

Updated seed script that uses dynamic materials and categories from configuration.

## Configuration Reference

### Product Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `product.categories` | `['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor']` | Available product categories |
| `product.materials` | `['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Ceramic', 'Bamboo']` | Available product materials |
| `product.currencies` | `['USD', 'EUR', 'RWF']` | Supported currencies |
| `product.defaultCurrency` | `'RWF'` | Default currency for products |

### Booking Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `booking.timeSlots` | `['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']` | Available booking time slots |
| `booking.serviceTypes` | `['consultation', 'showroom-visit', 'home-measurement', 'delivery']` | Available service types |
| `booking.statuses` | `['pending', 'confirmed', 'completed', 'cancelled']` | Available booking statuses |

### User Management Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `user.adminRoles` | `['superadmin', 'admin', 'moderator']` | Available admin roles |
| `user.defaultAdminRole` | `'admin'` | Default role for new admin users |

### System Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `system.upload.maxFileSize` | `5242880` | Max file upload size (bytes) |
| `system.upload.allowedTypes` | `['image/jpeg', 'image/png', 'image/gif', 'image/webp']` | Allowed file types |
| `system.upload.activityMaxFileSize` | `10485760` | Max activity file size (bytes) |
| `system.upload.activityAllowedTypes` | `['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']` | Allowed activity file types |
| `system.cors.allowedOrigins` | `['*']` | CORS allowed origins |
| `system.pagination.defaultLimit` | `12` | Default pagination limit |
| `system.pagination.adminLimit` | `10` | Admin pagination limit |

### Localization Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `localization.defaultLanguage` | `'en'` | Default language code |
| `localization.timezone` | `'UTC'` | Default timezone |

### Server Configurations

| Key | Default Value | Description |
|-----|---------------|-------------|
| `system.server.port` | `5000` | Default server port |
| `system.server.environment` | `'development'` | Default environment |

## Benefits of Dynamic Configuration

1. **No Code Changes Required** - Update system behavior without modifying code
2. **Database-Driven** - All configurations stored in MongoDB
3. **API Management** - Configure system through REST API
4. **Real-time Updates** - Changes take effect immediately
5. **Validation** - Dynamic validation based on current configuration
6. **Fallback Support** - Graceful degradation if configuration is missing
7. **Audit Trail** - Track configuration changes with timestamps
8. **Multi-tenant Ready** - Easy to extend for multiple environments

## Migration from Static to Dynamic

### Before (Static)
```javascript
// Hardcoded in model
category: {
  type: String,
  enum: ['living-room', 'bedroom', 'dining'] // Static enum
}
```

### After (Dynamic)
```javascript
// Dynamic validation
category: {
  type: String,
  required: true,
  validate: async function(value) {
    const validCategories = await this.constructor.getAvailableCategories();
    return validCategories.includes(value);
  }
}
```

## Best Practices

1. **Always Use Configuration Methods** - Use model methods instead of hardcoded arrays
2. **Handle Missing Configuration** - Provide fallback values
3. **Validate Configuration** - Check configuration exists before using
4. **Document Changes** - Update configuration descriptions when modifying
5. **Test Configuration Changes** - Use test script to verify functionality
6. **Backup Configurations** - Export configurations before major changes

## Troubleshooting

### Configuration Not Found
- Run `initializeConfigurations.js` to create default configurations
- Check configuration key spelling
- Verify configuration is active (`isActive: true`)

### Validation Errors
- Ensure configuration values match expected format
- Check model validation rules
- Use test script to diagnose issues

### Performance Issues
- Cache frequently accessed configurations
- Use appropriate indexes on Configuration model
- Monitor configuration query performance

## Future Enhancements

1. **Configuration Categories** - Group related configurations
2. **Configuration History** - Track configuration changes over time
3. **Configuration Validation** - Validate configuration values
4. **Configuration Export/Import** - Backup and restore configurations
5. **Configuration Environment** - Support different configs per environment
6. **Configuration Permissions** - Control who can modify which configurations
7. **Configuration Notifications** - Alert on configuration changes
8. **Configuration Testing** - Test configuration changes before applying

This dynamic configuration system ensures that all data in the application comes from the database, making the system flexible, maintainable, and easily configurable without code changes.