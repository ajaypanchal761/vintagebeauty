# APM Beauty & Perfume - Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## User Authentication

### Send OTP
**POST** `/users/send-otp`
- **Access:** Public
- **Body:**
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "data": {
      "phone": "9876543210",
      "otp": "123456" // Only in development
    }
  }
  ```

### Verify OTP
**POST** `/users/verify-otp`
- **Access:** Public
- **Body:**
  ```json
  {
    "phone": "9876543210",
    "otp": "123456",
    "name": "John Doe", // Optional for signup
    "email": "john@example.com" // Optional
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "data": {
      "user": { ... },
      "token": "jwt-token"
    }
  }
  ```

### Register (Password-based)
**POST** `/users/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210"
  }
  ```

### Login (Password-based)
**POST** `/users/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  OR
  ```json
  {
    "phone": "9876543210"
  }
  ```

### Get Current User
**GET** `/users/me`
- **Access:** Private

### Update User
**PUT** `/users/:id`
- **Access:** Private
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
  ```

### Add Address
**POST** `/users/:id/addresses`
- **Access:** Private
- **Body:**
  ```json
  {
    "type": "home",
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "isDefault": true
  }
  ```

### Update Address
**PUT** `/users/:id/addresses/:addressId`
- **Access:** Private

### Delete Address
**DELETE** `/users/:id/addresses/:addressId`
- **Access:** Private

### Set Default Address
**PUT** `/users/:id/addresses/:addressId/set-default`
- **Access:** Private

---

## Products

### Get All Products
**GET** `/products`
- **Access:** Public
- **Query Parameters:**
  - `category` - Filter by category name
  - `search` - Search in name, description, brandName
  - `minPrice` - Minimum price filter
  - `maxPrice` - Maximum price filter
  - `isFeatured` - Filter featured products (true/false)
  - `isBestSeller` - Filter bestseller products (true/false)
  - `isMostLoved` - Filter most loved products (true/false)
  - `inStock` - Filter in-stock products (true/false)
  - `gender` - Filter by gender (men/women/unisex)
  - `sort` - Sort by (price-low, price-high, rating, newest)
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 20)

### Get Single Product
**GET** `/products/:id`
- **Access:** Public

### Get Product by Slug
**GET** `/products/slug/:slug`
- **Access:** Public

### Get Featured Products
**GET** `/products/featured`
- **Access:** Public

### Get Bestseller Products
**GET** `/products/bestsellers`
- **Access:** Public

### Get Most Loved Products
**GET** `/products/most-loved`
- **Access:** Public

### Get Products by Category
**GET** `/products/category/:categorySlug`
- **Access:** Public

### Create Product (Admin)
**POST** `/products`
- **Access:** Private/Admin
- **Body:** FormData with product fields and images

### Update Product (Admin)
**PUT** `/products/:id`
- **Access:** Private/Admin

### Delete Product (Admin)
**DELETE** `/products/:id`
- **Access:** Private/Admin

---

## Cart

### Get Cart
**GET** `/cart`
- **Access:** Private

### Add to Cart
**POST** `/cart`
- **Access:** Private
- **Body:**
  ```json
  {
    "productId": "product-id",
    "quantity": 1,
    "size": "100ml"
  }
  ```

### Update Cart Item
**PUT** `/cart/:itemId`
- **Access:** Private
- **Body:**
  ```json
  {
    "quantity": 2,
    "size": "100ml",
    "selectedPrice": 699
  }
  ```

### Remove from Cart
**DELETE** `/cart/:itemId`
- **Access:** Private

### Clear Cart
**DELETE** `/cart`
- **Access:** Private

### Apply Coupon
**POST** `/cart/coupon`
- **Access:** Private
- **Body:**
  ```json
  {
    "code": "WELCOME10"
  }
  ```

### Remove Coupon
**DELETE** `/cart/coupon`
- **Access:** Private

---

## Orders

### Create Order
**POST** `/orders`
- **Access:** Private
- **Body:**
  ```json
  {
    "orderItems": [
      {
        "product": "product-id",
        "name": "Product Name",
        "quantity": 1,
        "price": 699,
        "size": "100ml",
        "selectedPrice": 699,
        "image": "image-url"
      }
    ],
    "shippingAddress": {
      "type": "home",
      "name": "John Doe",
      "phone": "9876543210",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "paymentMethod": "cod",
    "itemsPrice": 699,
    "shippingPrice": 50,
    "discountPrice": 0,
    "totalPrice": 749,
    "coupon": {
      "code": "WELCOME10",
      "discount": 50
    }
  }
  ```

### Get User Orders
**GET** `/orders`
- **Access:** Private

### Get Single Order
**GET** `/orders/:id`
- **Access:** Private

### Cancel Order
**PUT** `/orders/:id/cancel`
- **Access:** Private
- **Body:**
  ```json
  {
    "reason": "Changed my mind"
  }
  ```

### Get All Orders (Admin)
**GET** `/orders/admin/all`
- **Access:** Private/Admin

### Update Order Status (Admin)
**PUT** `/orders/:id/status`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "orderStatus": "shipped"
  }
  ```
  - Valid statuses: `pending`, `confirmed`, `processing`, `shipped`, `out-for-delivery`, `delivered`, `cancelled`

### Handle Cancellation Request (Admin)
**PUT** `/orders/:id/cancellation`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "action": "approve", // or "reject"
    "reasonForRejection": "Order already shipped" // if rejecting
  }
  ```

---

## Wishlist

### Get Wishlist
**GET** `/wishlist`
- **Access:** Private

### Add to Wishlist
**POST** `/wishlist`
- **Access:** Private
- **Body:**
  ```json
  {
    "productId": "product-id"
  }
  ```

### Remove from Wishlist
**DELETE** `/wishlist/:productId`
- **Access:** Private

### Clear Wishlist
**DELETE** `/wishlist`
- **Access:** Private

---

## Categories

### Get All Categories
**GET** `/categories`
- **Access:** Public

### Get Single Category
**GET** `/categories/:id`
- **Access:** Public

### Get Category by Slug
**GET** `/categories/slug/:slug`
- **Access:** Public

### Create Category (Admin)
**POST** `/categories`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "name": "Perfumes",
    "description": "Premium perfumes",
    "image": "image-url"
  }
  ```

### Update Category (Admin)
**PUT** `/categories/:id`
- **Access:** Private/Admin

### Delete Category (Admin)
**DELETE** `/categories/:id`
- **Access:** Private/Admin

---

## Coupons

### Get Active Coupons
**GET** `/coupons/active`
- **Access:** Public

### Get Coupon by Code
**GET** `/coupons/code/:code`
- **Access:** Public

### Get All Coupons (Admin)
**GET** `/coupons`
- **Access:** Private/Admin

### Get Single Coupon (Admin)
**GET** `/coupons/:id`
- **Access:** Private/Admin

### Create Coupon (Admin)
**POST** `/coupons`
- **Access:** Private/Admin
- **Body:**
  ```json
  {
    "code": "WELCOME10",
    "discountType": "percentage",
    "discountValue": 10,
    "maxDiscount": 100,
    "minPurchase": 500,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.000Z",
    "usageLimit": 1000,
    "isActive": true
  }
  ```

### Update Coupon (Admin)
**PUT** `/coupons/:id`
- **Access:** Private/Admin

### Delete Coupon (Admin)
**DELETE** `/coupons/:id`
- **Access:** Private/Admin

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Order Status Flow

1. `pending` - Order placed, awaiting confirmation
2. `confirmed` - Order confirmed
3. `processing` - Order being processed
4. `shipped` - Order shipped
5. `out-for-delivery` - Out for delivery
6. `delivered` - Order delivered
7. `cancelled` - Order cancelled

## Payment Methods

- `cod` - Cash on Delivery
- `online` - Online payment
- `card` - Card payment
- `upi` - UPI payment

## Payment Status

- `pending` - Payment pending
- `completed` - Payment completed
- `failed` - Payment failed
- `refunded` - Payment refunded

---

## Notes

1. All timestamps are in ISO 8601 format
2. Prices are in Indian Rupees (₹)
3. Phone numbers should be 10 digits
4. OTP is valid for 10 minutes
5. JWT tokens expire in 30 days (configurable)
6. File uploads are limited to 5MB per file
7. In development mode, OTP is returned in response (remove in production)

