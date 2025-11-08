# Lost and Found Backend

## Overview

Backend API for a lost and found management system at Thapar Institute. This system allows:

- Public browsing of lost items without authentication
- Users to claim items after login/signup
- Admins to manage items and approve/reject claims

## Features

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
