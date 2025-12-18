# APM Beauty and Perfume - Backend API

Backend API for the APM Beauty and Perfume e-commerce platform built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection configuration
│   └── cloudinary.js         # Cloudinary configuration (optional)
├── controller/
│   ├── userController.js     # User authentication & management
│   ├── productController.js  # Product CRUD operations
│   ├── cartController.js    # Shopping cart operations
│   ├── orderController.js    # Order management
│   ├── wishlistController.js # Wishlist operations
│   ├── categoryController.js # Category management
│   └── couponController.js   # Coupon management
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handler
│   └── upload.js            # File upload middleware
├── model/
│   ├── User.js              # User Mongoose model
│   ├── Product.js           # Product model
│   ├── Cart.js              # Cart model
│   ├── Order.js             # Order model
│   ├── Wishlist.js          # Wishlist model
│   ├── Category.js          # Category model
│   └── Coupon.js            # Coupon model
├── routes/
│   ├── userRoutes.js        # User API routes
│   ├── productRoutes.js     # Product API routes
│   ├── cartRoutes.js        # Cart API routes
│   ├── orderRoutes.js       # Order API routes
│   ├── wishlistRoutes.js    # Wishlist API routes
│   ├── categoryRoutes.js   # Category API routes
│   └── couponRoutes.js      # Coupon API routes
├── utils/
│   └── generateToken.js     # JWT token generator
├── API_DOCUMENTATION.md     # Complete API documentation
├── package.json             # Project dependencies
├── server.js                # Express server entry point
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and update the following:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secret key for JWT tokens
   - `PORT` - Server port (default: 5000)
   - `CORS_ORIGIN` - Frontend URL for CORS

3. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/users/send-otp` - Send OTP to phone number
- `POST /api/users/verify-otp` - Verify OTP and login/signup
- `POST /api/users/register` - Register a new user (password-based)
- `POST /api/users/login` - Login user (password-based)

### User Management
- `GET /api/users/me` - Get current user (Protected)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Address Management
- `POST /api/users/:id/addresses` - Add address (Protected)
- `PUT /api/users/:id/addresses/:addressId` - Update address (Protected)
- `DELETE /api/users/:id/addresses/:addressId` - Delete address (Protected)
- `PUT /api/users/:id/addresses/:addressId/set-default` - Set default address (Protected)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/featured` - Get featured products
- `GET /api/products/bestsellers` - Get bestseller products
- `GET /api/products/most-loved` - Get most loved products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart (Protected)
- `POST /api/cart` - Add to cart (Protected)
- `PUT /api/cart/:itemId` - Update cart item (Protected)
- `DELETE /api/cart/:itemId` - Remove from cart (Protected)
- `DELETE /api/cart` - Clear cart (Protected)
- `POST /api/cart/coupon` - Apply coupon (Protected)
- `DELETE /api/cart/coupon` - Remove coupon (Protected)

### Orders
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders` - Get user orders (Protected)
- `GET /api/orders/:id` - Get single order (Protected)
- `PUT /api/orders/:id/cancel` - Cancel order (Protected)
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancellation` - Handle cancellation request (Admin)

### Wishlist
- `GET /api/wishlist` - Get wishlist (Protected)
- `POST /api/wishlist` - Add to wishlist (Protected)
- `DELETE /api/wishlist/:productId` - Remove from wishlist (Protected)
- `DELETE /api/wishlist` - Clear wishlist (Protected)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/slug/:slug` - Get category by slug
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Coupons
- `GET /api/coupons/active` - Get active coupons
- `GET /api/coupons/code/:code` - Get coupon by code
- `GET /api/coupons` - Get all coupons (Admin)
- `POST /api/coupons` - Create coupon (Admin)
- `PUT /api/coupons/:id` - Update coupon (Admin)
- `DELETE /api/coupons/:id` - Delete coupon (Admin)

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 📝 Example API Requests

### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91 98765 43210"
}
```

### Login
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```bash
GET /api/users/me
Authorization: Bearer <token>
```

### Add Address
```bash
POST /api/users/:userId/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "home",
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **multer** - File upload handling
- **Cloudinary** - Image storage (optional)

## 📦 Dependencies

### Production
- express - Web framework
- mongoose - MongoDB ODM
- cors - Cross-origin resource sharing
- dotenv - Environment variables
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- multer - File upload handling
- cloudinary - Image storage (optional)

### Development
- nodemon - Auto-restart server on changes

## ✨ Features

- **OTP-based Authentication** - Phone number verification with OTP
- **Password-based Authentication** - Traditional email/password login
- **Product Management** - Full CRUD operations with sizes, pricing, and images
- **Shopping Cart** - Add, update, remove items with size and price selection
- **Order Management** - Complete order lifecycle with tracking
- **Wishlist** - Save favorite products
- **Address Management** - Multiple addresses with default selection
- **Coupon System** - Percentage and fixed discount coupons
- **Category Management** - Organize products by categories
- **Admin Panel Support** - Role-based access control
- **Order Tracking** - Real-time order status updates
- **Stock Management** - Automatic stock updates on orders

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes with middleware
- Role-based access control (Admin/User)
- Input validation
- Error handling

## 📄 License

ISC

