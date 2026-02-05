# Lost and Found Backend

## Overview

Backend API for a lost and found management system at Thapar Institute. This system allows:

- Public browsing of lost items without authentication
- Users to claim items after login/signup
- Admins to manage items and approve/reject claims

## Features

### Performance Optimization

- **Redis Caching**: Intelligent caching layer for frequently accessed data
  - Items list cached for 1 hour with query-based cache keys
  - Individual item details cached for 1 hour
  - User claims cached for 10 minutes
  - Automatic cache invalidation on data changes
  - Graceful fallback - app works without Redis

### For Public Users (No Authentication)

- Browse all items with filters (category, location, time period, search)
- View detailed information about specific items
- See images of found items

### For Authenticated Users

- Claim lost items
- View all their claim requests and statuses
- View profile information

### For Admins

- Full CRUD operations on items
- View all pending claim requests
- Approve or reject claims with remarks
- View all claims for a specific item
- Manually decide who gets the item after cross-questioning

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Redis/Valkey Configuration (Optional - for caching)
# Get from Render Dashboard or leave empty to run without caching
REDIS_URL=rediss://your-redis-url

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email Configuration (Optional)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# AWS S3 (Optional - for image uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
```

3. Start the server:

```bash
npm run dev
```

## Quick Start with Mock Data 🚀

**For testing and development, use our seeding scripts:**

```bash
# Option 1: Full database seed (Recommended for fresh start)
# Creates 5 users, 15 items, and 3 pending claims
npm run seed

# Option 2: Add more items without clearing database
npm run add-items

# Option 3: Create admin user
npm run create-admin  # Quick with defaults
npm run create-admin-interactive  # Custom details
```

**Test Credentials After Seeding:**

- **Admin**: admin@thapar.edu / admin123
- **User**: john.doe@thapar.edu / password123

📖 **See [SEEDING_GUIDE.md](./SEEDING_GUIDE.md) for detailed instructions**

## Models

### Item Model

- `itemId`: Unique identifier
- `name`: Item name
- `description`: Item description
- `category`: Item category (bottle, earpods, watch, phone, etc.)
- `foundLocation`: Where the item was found
- `images`: Array of image URLs
- `briefNotes`: Additional notes
- `dateFound`: When the item was found
- `isClaimed`: Whether the item has been claimed and approved
- `owner`: Reference to User who was approved to claim it

### Claim Model

- `item`: Reference to Item
- `claimant`: Reference to User claiming the item
- `status`: pending, approved, rejected
- `remarks`: Admin's notes about the claim

### User Model

- `name`: User's full name
- `email`: Must be @thapar.edu
- `password`: Hashed password
- `rollNo`: Student roll number
- `isAdmin`: Admin flag (manually set in DB)

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Key Endpoints:

- `GET /api/user/items` - Get all items (public, with filters)
- `GET /api/user/items/:id` - Get item details (public)
- `POST /api/user/items/:id/claim` - Claim an item (authenticated)
- `GET /api/user/my-claims` - Get user's claims (authenticated)
- `GET /api/auth/profile` - Get user profile (authenticated)
- `POST /api/admin/items` - Create item (admin)
- `PATCH /api/admin/items/:id` - Update item (admin)
- `DELETE /api/admin/items/:id` - Delete item (admin)
- `GET /api/admin/claims` - Get pending claims (admin)
- `PATCH /api/admin/claims/:id/approve` - Approve claim (admin)
- `PATCH /api/admin/claims/:id/reject` - Reject claim (admin)

## Workflow

1. **Admin adds a found item** with basic details (not too much info for security)
2. **Public users browse items** without needing to login
3. **User sees item they lost** and clicks "Request Claim"
4. **System prompts login/signup** if not authenticated
5. **Claim request is created** with status "pending"
6. **Admin reviews all claims** for an item
7. **Admin cross-questions claimants** in person
8. **Admin approves one claim** - item is marked as claimed
9. **Other pending claims are auto-rejected**
10. **User can see claim status** in their profile

## Filter Options

### Categories

bottle, earpods, watch, phone, wallet, id_card, keys, bag, laptop, charger, books, stationery, glasses, jewelry, clothing, electronics, other

### Time Periods

- yesterday
- day_before_yesterday
- last_week
- last_month
- last_3_months

### Locations

COS, Library, LT, near HOSTEL O C D M, near HOSTEL A B J H, near HOSTEL Q PG, near HOSTEL E N G I, near HOSTEL K L, SBI LAWN, G BLOCK, SPORTS AREA, Auditorium, Main Gate, Jaggi

## Authentication

- JWT tokens are used for authentication
- Tokens are stored in HTTP-only cookies
- Token expires in 1 hour
- Admin status must be manually set in database

## Setting Up First Admin

1. Create a user through signup
2. Connect to MongoDB
3. Find the user and set `isAdmin: true`

```javascript
db.users.updateOne({ email: "admin@thapar.edu" }, { $set: { isAdmin: true } });
```

## Development Notes

- Uses ES6 modules (type: "module" in package.json)
- MongoDB with Mongoose ODM
- Express.js for routing
- bcryptjs for password hashing
- JWT for authentication
- Helmet for security headers
- Morgan for logging
- CORS enabled
- **Redis (ioredis)** for caching (optional)
  - Supports Render's managed Redis/Valkey
  - TLS enabled for secure connections
  - Development-only logging for cache operations
  - Production-optimized with silent caching

## Redis Caching (Optional)

### Benefits

- **Faster API responses**: 1000ms → 5-10ms on cache hits
- **Reduced database load**: Fewer MongoDB queries
- **Cost savings**: Lower database read operations
- **Better scalability**: Handle more concurrent users

### Cached Endpoints

1. `GET /api/user/items` - Items list (1 hour TTL)
2. `GET /api/user/items/:id` - Item details (1 hour TTL)
3. `GET /api/user/my-claims` - User claims (10 minutes TTL)

### Cache Invalidation

Cache automatically clears when:

- Items are created, updated, or deleted (admin)
- Claims are approved (changes item status)
- New claims are created

### Setup Redis on Render

1. Create a Redis instance in Render Dashboard
2. Copy the **External Key Value URL** (rediss://...)
3. Add to environment variables: `REDIS_URL=rediss://...`
4. Deploy - caching works automatically!

### Running Without Redis

App works perfectly without Redis - just leave `REDIS_URL` empty or unset. Caching will be disabled and all requests go directly to MongoDB.
