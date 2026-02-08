# 🎓 Thapar Institute Lost & Found System

A full-stack web application for managing lost and found items at **Thapar Institute of Engineering and Technology**. This system streamlines the process of reporting found items and claiming lost ones, with admin oversight for verification.

## 🌟 Features

### 👥 For Public Users (No Authentication Required)

- 🔍 Browse all found items with advanced filters
- 📱 Search by category, location, and time period
- 👁️ View detailed item information and images
- 🎨 Dark mode support
- ✨ Smooth animations and modern UI

### 🔐 For Authenticated Users

- 📝 Claim lost items with detailed descriptions
- 📊 Track claim status (Pending/Approved/Rejected)
- 👤 View personal profile and claim history
- 🔔 Real-time notifications via toast messages

### 👨‍💼 For Admins

- ➕ Create, edit, and delete found items
- 🔢 Auto-generated unique Item IDs (ITEM000001, ITEM000002, etc.)
- 📋 Manage pending, approved, and rejected claims
- ✅ Approve claims after cross-questioning claimants
- ❌ Reject claims with admin remarks
- 🔍 Advanced search and filter for items and claims
- 📊 Paginated data management
- 🚫 Automatic rejection of competing claims when one is approved

### 🔒 Security & Performance Features

- 🛡️ **Rate Limiting** - Protection against brute force & DDoS attacks
  - Auth endpoints: 50 requests/15 min
  - Claim endpoints: 10 requests/hour
  - Admin endpoints: 200 requests/15 min
- 🔄 **Idempotency Middleware** - Prevents duplicate requests with `Idempotency-Key` header
- ⚡ **Redis Caching** - Fast data retrieval with automatic cache invalidation
  - Item listings cached
  - User claims cached
  - Admin queries optimized
- 🔐 **Security Headers** - Helmet.js for production-grade security
- 🧹 **Input Sanitization** - XSS & MongoDB injection protection
- 📧 **Email Notifications** - Automated status updates for claims
- 📦 **Image Storage** - AWS S3 integration for secure image uploads

## 🛠️ Tech Stack

### Frontend

- **React 19.1.1** - UI library
- **React Router 7.9.5** - Client-side routing
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **Framer Motion 12.23.24** - Animation library
- **Vite 7.1.7** - Build tool
- **Lucide React** - Icon library
- **React Toastify** - Toast notifications
- **Axios** - HTTP client

### Backend

- **Node.js** - JavaScript runtime
- **Express 5.1.0** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8.19.3** - ODM for MongoDB
- **Redis (ioredis 5.8.2)** - Caching & session management
- **JWT** - Authentication tokens
- **Google OAuth 2.0** - Secure authentication via Thapar email
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Express Rate Limit** - API rate limiting
- **AWS S3** - Image storage
- **Nodemailer** - Email notifications
- **Joi** - Schema validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Redis (optional - for caching, falls back gracefully if not available)
- AWS S3 account (optional - for image uploads)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd softwareProject
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lostfound
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development

# Redis (Optional - for caching & rate limiting)
REDIS_URL=redis://localhost:6379

# AWS S3 (Optional - for image uploads)
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@thapar.edu
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Seed Database (Optional but Recommended)

```bash
cd ../backend
npm run seed
```

This creates:

- 5 test users (including 1 admin)
- 15 sample items
- 3 pending claims

**Default Test Users:**

- **Admin**: admin@thapar.edu (Google OAuth)
- **User**: john.doe@thapar.edu (Google OAuth)

_Note: Authentication is via Google OAuth using @thapar.edu emails only_

### 5. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The app will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## 📚 Project Structure

```
softwareProject/
├── backend/
│   ├── controllers/        # Request handlers
│   │   ├── admin.controller.js
│   │   ├── auth.controllers.js
│   │   ├── report.controller.js
│   │   └── user.controller.js
│   ├── middlewares/        # Auth, validation & security
│   │   ├── auth.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── idempotency.middleware.js
│   ├── models/            # Database schemas
│   │   ├── claim.model.js
│   │   ├── item.model.js
│   │   ├── user.model.js
│   │   └── report.model.js
│   ├── routes/            # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── report.routes.js
│   ├── utils/             # Helper utilities
│   │   ├── redisClient.js
│   │   ├── email.utils.js
│   │   └── s3.utils.js
│   ├── config/            # Configuration
│   │   ├── email.config.js
│   │   └── passport.config.js
│   ├── index.js           # Entry point
│   ├── utils.js           # Helper functions
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   ├── DarkModeToggle.jsx
│   │   │   └── FloatingActionButton.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── login.jsx
│   │   │   ├── admin.jsx
│   │   │   └── Claim_items.jsx
│   │   ├── context/       # React Context
│   │   │   └── DarkModeContext.jsx
│   │   ├── utils/         # Utilities
│   │   │   ├── api.js     # Axios config
│   │   │   └── constants.js
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
```

## 🔐 Authentication & Authorization

- **Google OAuth 2.0 authentication** with @thapar.edu email restriction
- **JWT-based sessions** with HTTP-only cookies
- **Token expiry**: 1 hour
- **Admin privileges** must be manually set in the database
- **Protected routes** for user claims and admin dashboard
- **Email validation**: Only @thapar.edu emails allowed

## 🎯 Key Workflows

### 1. Item Recovery Flow

```
Admin finds item → Creates entry in system →
User browses items → Recognizes their item →
Requests claim (with proof) → Admin cross-questions →
Admin approves claim → Item marked as claimed →
Other pending claims auto-rejected → User collects item
```

### 2. Admin Approval Process

```
View pending claims → Check claimant details →
Cross-question in person → Verify ownership proof →
Approve correct claimant → Add remarks →
System auto-rejects other claims → Notify users
```

## 📊 Database Models

### User

- Email (must be @thapar.edu)
- Name, Roll Number
- Google ID
- Profile Picture (Google)
- isAdmin flag

### Item

- Item ID (auto-generated: ITEM000001)
- Name, Description, Category
- Found Location, Date Found
- Images, Brief Notes
- isClaimed, Owner Reference

### Claim

- Item Reference
- Claimant Reference
- Status (pending/approved/rejected)
- Admin Remarks
- Proof Description

## 🎨 Categories & Locations

**Categories:**
bottle, earpods, watch, phone, wallet, id_card, keys, bag, laptop, charger, books, stationery, glasses, jewelry, clothing, electronics, other

**Locations:**
COS, Library, LT, near HOSTEL O C D M, near HOSTEL A B J H, near HOSTEL Q PG, near HOSTEL E N G I, near HOSTEL K L, SBI LAWN, G BLOCK, SPORTS AREA, Auditorium, Main Gate, Jaggi

## 🔍 Filter Options

- **Category Filter**: Filter by item type
- **Location Filter**: Filter by where item was found
- **Status Filter**: Available or Claimed items
- **Time Period**: Yesterday, Last Week, Last Month, Last 3 Months
- **Search**: Search in item name or description
- **Claim Status**: Pending, Approved, or Rejected claims

## 🛡️ Security Features

- Google OAuth 2.0 integration
- JWT token authentication
- @thapar.edu email domain restriction
- HTTP-only cookies
- Helmet.js for security headers
- CORS protection
- Input validation & sanitization
- XSS protection with xss-clean
- MongoDB injection prevention with express-mongo-sanitize
- HPP (HTTP Parameter Pollution) protection
- Admin-only routes
- No future dates for "Date Found"
- Rate limiting on all endpoints
- Idempotency support for critical operations
- Redis-backed session management
- CSRF protection

## 📖 API Documentation

Detailed API documentation is available in `backend/API_DOCUMENTATION.md`

**Key Endpoints:**

- `GET /api/user/items` - Browse items (public, cached)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/user/items/:id/claim` - Claim item (rate limited: 10/hour, idempotent)
- `GET /api/user/my-claims` - View my claims (cached)
- `POST /api/admin/items` - Create item (admin, cache invalidation)
- `PATCH /api/admin/claims/:id/approve` - Approve claim (admin, idempotent)

## 🧪 Testing

**Seed Database:**

```bash
npm run seed          # Full reset with test data
npm run add-items     # Add more items
npm run create-admin  # Create admin user
```

**Check Database Status:**

```bash
npm run db-status
```

## 🎓 Admin Account Setup

### Method 1: Using Seed Script

```bash
npm run seed
```

Creates admin@thapar.edu / admin123

### Method 2: Manual Setup

1. Login with your @thapar.edu Google account through the UI
2. Connect to MongoDB
3. Run:

```javascript
db.users.updateOne(
  { email: "youremail@thapar.edu" },
  { $set: { isAdmin: true } },
);
```

## 🚨 Common Issues & Solutions

**Issue**: Can't see approved claims in Approved Claims tab  
**Solution**: The filter was set to 'pending' by default. Now fixed to 'all'.

**Issue**: Item ID field shows when creating items  
**Solution**: Item IDs are now auto-generated (ITEM000001 format).

**Issue**: Claimed items are still clickable  
**Solution**: Claimed items now have reduced opacity and are non-interactive.

**Issue**: Admin filters not working  
**Solution**: Backend now properly parses search, category, location, and status filters.

**Issue**: Redis connection errors  
**Solution**: Redis is optional. If REDIS_URL is not provided, the app works without caching. For production, ensure Redis is running or use a managed service like Redis Cloud.

**Issue**: Rate limit errors during testing  
**Solution**: Rate limits are configured per IP. For development, limits are relaxed. Use different IPs or wait for the time window to reset.

**Issue**: Duplicate claim submissions  
**Solution**: Use `Idempotency-Key` header with a unique UUID to prevent duplicate requests.

## 🚀 Performance Optimizations

### Caching Strategy

- **Item listings**: Cached for 5 minutes, auto-invalidated on create/update/delete
- **User claims**: Cached per user, invalidated when claim status changes
- **Admin queries**: Optimized with Redis caching

### Database Indexes

- User email index (unique)
- Item category, location, and date indexes
- Claim status and item indexes
- Compound indexes for common query patterns

### Rate Limiting

All endpoints are protected with appropriate rate limits to prevent abuse:

- Authentication: 50 requests per 15 minutes
- Claims: 10 requests per hour
- Admin operations: 200 requests per 15 minutes

## 🔄 Idempotency

Critical endpoints support idempotency to prevent duplicate operations:

```javascript
// Frontend example
const response = await axios.post("/api/user/items/:id/claim", claimData, {
  headers: {
    "Idempotency-Key": "unique-uuid-for-this-request",
  },
});
```

Idempotent endpoints cache responses for 24 hours. Retry with the same key returns the cached response.

## 📝 License

This project is for educational purposes at Thapar Institute of Engineering and Technology.

## 👥 Contributors

- Your Name/Team Name

## 📞 Contact

For issues or questions, contact: [your-email@thapar.edu]

---

**Made with ❤️ for Thapar Institute of Engineering and Technology**
