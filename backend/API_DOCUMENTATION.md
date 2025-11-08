# Backend API Documentation

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
