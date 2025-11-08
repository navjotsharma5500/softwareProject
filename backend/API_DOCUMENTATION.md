# API Documentation

## Base URL

`http://localhost:3000`

---

## Public Routes (No Authentication Required)

### 1. Get All Items with Filters

**Endpoint:** `GET /api/user/items`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category (bottle, earpods, watch, phone, wallet, id_card, keys, bag, laptop, charger, books, stationery, glasses, jewelry, clothing, electronics, other)
- `location` (optional): Filter by found location
- `claimed` (optional): Filter by claimed status (true/false)
- `timePeriod` (optional): Filter by time period (yesterday, day_before_yesterday, last_week, last_month, last_3_months)
- `search` (optional): Search in name or description

**Response:**

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Item by ID

**Endpoint:** `GET /api/user/items/:id`

**Response:**

```json
{
  "item": {
    "_id": "...",
    "itemId": "...",
    "name": "...",
    "description": "...",
    "category": "...",
    "foundLocation": "...",
    "images": [...],
    "dateFound": "...",
    "isClaimed": false,
    "owner": {...}
  }
}
```

---

## Authentication Routes

### 1. Sign Up

**Endpoint:** `POST /api/auth/signup`

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@thapar.edu",
  "password": "password123",
  "rollNo": 102103456
}
```

**Response:**

```json
{
  "user": {...},
  "message": "User created"
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Body:**

```json
{
  "email": "john@thapar.edu",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "...",
  "message": "Login successful"
}
```

### 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Response:**

```json
{
  "message": "Logout successful"
}
```

### 4. Get Profile

**Endpoint:** `GET /api/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@thapar.edu",
    "rollNo": 102103456,
    "isAdmin": false
  }
}
```

---

## User Routes (Authentication Required)

### 1. Claim an Item

**Endpoint:** `POST /api/user/items/:id/claim`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Claim requested successfully",
  "claim": {
    "_id": "...",
    "item": {...},
    "claimant": {...},
    "status": "pending",
    "createdAt": "..."
  }
}
```

### 2. Get My Claims

**Endpoint:** `GET /api/user/my-claims`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Claims per page (default: 10)

**Response:**

```json
{
  "claims": [...],
  "pagination": {...}
}
```

---

## Admin Routes (Admin Authentication Required)

### 1. Get All Items

**Endpoint:** `GET /api/admin/items`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**

```json
{
  "items": [...],
  "pagination": {...}
}
```

### 2. Create Item

**Endpoint:** `POST /api/admin/items`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "itemId": "ITEM001",
  "name": "Blue Water Bottle",
  "description": "Blue metal water bottle with stickers",
  "category": "bottle",
  "foundLocation": "Library",
  "images": ["url1", "url2"],
  "briefNotes": "Found near desk 5",
  "dateFound": "2025-11-08"
}
```

**Response:**

```json
{
  "message": "Item created successfully",
  "item": {...}
}
```

### 3. Get Item by ID

**Endpoint:** `GET /api/admin/items/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "item": {...}
}
```

### 4. Update Item

**Endpoint:** `PATCH /api/admin/items/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:** (Any fields to update)

```json
{
  "name": "Updated name",
  "description": "Updated description",
  "images": ["newUrl1", "newUrl2"]
}
```

**Response:**

```json
{
  "message": "Item updated successfully",
  "item": {...}
}
```

### 5. Delete Item

**Endpoint:** `DELETE /api/admin/items/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Item deleted successfully"
}
```

### 6. Get All Claims for an Item

**Endpoint:** `GET /api/admin/items/:id/claims`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "claims": [
    {
      "_id": "...",
      "item": "...",
      "claimant": {...},
      "status": "pending",
      "createdAt": "..."
    }
  ]
}
```

### 7. Get All Pending Claims

**Endpoint:** `GET /api/admin/claims`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Claims per page (default: 10)

**Response:**

```json
{
  "claims": [...],
  "pagination": {...}
}
```

### 8. Approve Claim

**Endpoint:** `PATCH /api/admin/claims/:id/approve`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "remarks": "Verified identity" (optional)
}
```

**Response:**

```json
{
  "message": "Claim approved",
  "claim": {...}
}
```

### 9. Reject Claim

**Endpoint:** `PATCH /api/admin/claims/:id/reject`

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "remarks": "Identity not verified" (optional)
}
```

**Response:**

```json
{
  "message": "Claim rejected",
  "claim": {...}
}
```

---

## Categories

- bottle
- earpods
- watch
- phone
- wallet
- id_card
- keys
- bag
- laptop
- charger
- books
- stationery
- glasses
- jewelry
- clothing
- electronics
- other

## Locations

- COS
- Library
- LT
- near HOSTEL O C D M
- near HOSTEL A B J H
- near HOSTEL Q PG
- near HOSTEL E N G I
- near HOSTEL K L
- SBI LAWN
- G BLOCK
- SPORTS AREA
- Auditorium
- Main Gate
- Jaggi

## Time Periods

- yesterday
- day_before_yesterday
- last_week
- last_month
- last_3_months

## Base URL

```
http://localhost:3000/api
```

---

## Authentication Endpoints

### Sign Up User

**POST** `/auth/signup`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@thapar.edu",
  "password": "password123",
  "rollNo": 20231234
}
```

**Response:**

```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@thapar.edu",
    "rollNo": 20231234,
    "isAdmin": false
  },
  "message": "User created"
}
```

---

### Login User

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "john@thapar.edu",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

**Note:** Token is automatically set as a cookie. Use this token for authenticated requests.

---

### Logout User

**POST** `/auth/logout`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

---

## User Endpoints (Authenticated)

### Get All Available Items

**GET** `/user/items`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "items": [
    {
      "_id": "item_id",
      "itemId": "item_code",
      "name": "Lost Phone",
      "description": "Black iPhone 12",
      "foundLocation": "Library",
      "dateFound": "2025-11-07",
      "isClaimed": false,
      "owner": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Claim an Item

**POST** `/user/items/:itemId/claim`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Claim requested",
  "item": {
    "_id": "item_id",
    "name": "Lost Phone",
    "owner": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@thapar.edu"
    },
    "isClaimed": false
  }
}
```

---

### Get My Claims

**GET** `/user/my-claims`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "items": [
    {
      "_id": "item_id",
      "name": "Lost Phone",
      "owner": { "name": "John Doe" },
      "isClaimed": false
    }
  ],
  "pagination": { ... }
}
```

---

## Admin Endpoints (Admin Only)

### Get All Items

**GET** `/admin/items`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "items": [...],
  "pagination": {...}
}
```

---

### Get Pending Claims

**GET** `/admin/claims`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "items": [
    {
      "_id": "item_id",
      "name": "Lost Phone",
      "owner": { "name": "John Doe", "email": "john@thapar.edu" },
      "isClaimed": false
    }
  ],
  "pagination": {...}
}
```

---

### Approve a Claim

**PATCH** `/admin/claims/:itemId/approve`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "message": "Claim approved",
  "item": { ... }
}
```

---

### Reject a Claim

**PATCH** `/admin/claims/:itemId/reject`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "message": "Claim rejected",
  "item": { ... }
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Access Denied. No token provided."
}
```

### 403 Forbidden (Admin Only)

```json
{
  "message": "Access Denied. Admins only."
}
```

### 400 Bad Request

```json
{
  "message": "Missing required fields"
}
```

### 404 Not Found

```json
{
  "message": "Item not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## Important Notes

1. **Email Domain:** Only `@thapar.edu` emails are allowed for signup
2. **Authentication:** Include the JWT token in the `Authorization` header as `Bearer <token>`
3. **Token Expiry:** Tokens expire in 1 hour
4. **Admin Access:** Only admin users can access `/admin/*` endpoints
5. **Item Status:**
   - `isClaimed: false` = Item pending approval
   - `isClaimed: true` = Item claim approved
6. **Pagination:** Default page size is 10 items

---

## Example Usage (Frontend)

```javascript
// Login
const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@thapar.edu",
    password: "password123",
  }),
});
const { token } = await loginRes.json();

// Get Items
const itemsRes = await fetch("http://localhost:3000/api/user/items", {
  headers: { Authorization: `Bearer ${token}` },
});
const { items } = await itemsRes.json();
```
