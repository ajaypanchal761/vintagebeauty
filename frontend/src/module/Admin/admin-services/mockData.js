// Mock data for frontend-only implementation
import { productImages, categoryImages } from './imageImports';

export const mockProducts = [
  // Gift Sets (imge1) - MRP: Rs 1299/-
  {
    _id: '1',
    name: 'Luxury Perfume Gift Set Premium',
    price: 1299,
    regularPrice: 1299,
    stock: 50,
    inStock: true,
    category: 'cat1',
    categoryName: 'Gift Sets',
    size: 'Gift Set',
    images: [productImages.product1],
    image: productImages.product1,
    description: 'Premium perfume gift set with elegant packaging. Perfect for special occasions and gifting.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.7,
    reviews: 1300
  },
  {
    _id: '2',
    name: 'Deluxe Fragrance Collection',
    price: 1299,
    regularPrice: 1299,
    stock: 35,
    inStock: true,
    category: 'cat1',
    categoryName: 'Gift Sets',
    size: 'Gift Set',
    images: [productImages.product2, productImages.product2_1],
    image: productImages.product2,
    description: 'Deluxe collection of premium fragrances in beautiful gift packaging.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.9,
    reviews: 850
  },
  {
    _id: '3',
    name: 'Classic Gift Box Set',
    price: 1299,
    regularPrice: 1299,
    stock: 25,
    inStock: true,
    category: 'cat1',
    categoryName: 'Gift Sets',
    size: 'Gift Set',
    images: [productImages.product3, productImages.product3_1],
    image: productImages.product3,
    description: 'Classic perfume gift box set with multiple fragrances.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.6,
    reviews: 620
  },
  {
    _id: '4',
    name: 'Premium Fragrance Gift Pack',
    price: 1299,
    regularPrice: 1299,
    stock: 20,
    inStock: true,
    category: 'cat1',
    categoryName: 'Gift Sets',
    size: 'Gift Set',
    images: [productImages.product4, productImages.product4_1, productImages.product4_2],
    image: productImages.product4,
    description: 'Premium fragrance gift pack with exclusive scents.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.8,
    reviews: 450
  },
  
  // 100 ml Perfume (imge2) - MRP: Rs 699/-
  {
    _id: '5',
    name: 'CEO Man Perfume 100ml',
    price: 699,
    regularPrice: 699,
    stock: 30,
    inStock: true,
    category: 'cat2',
    categoryName: '100 ml Perfume',
    size: '100 ml',
    images: [productImages.product5, productImages.product5_1],
    image: productImages.product5,
    description: 'Executive fragrance for the modern professional man. Bold and sophisticated.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.8,
    reviews: 1100
  },
  {
    _id: '6',
    name: 'Boss Men Eau de Parfum 100ml',
    price: 699,
    regularPrice: 699,
    stock: 40,
    inStock: true,
    category: 'cat2',
    categoryName: '100 ml Perfume',
    size: '100 ml',
    images: [productImages.product6],
    image: productImages.product6,
    description: 'Powerful and masculine fragrance with long-lasting scent.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.7,
    reviews: 950
  },
  {
    _id: '7',
    name: 'Elite Gentleman Fragrance 100ml',
    price: 699,
    regularPrice: 699,
    stock: 28,
    inStock: true,
    category: 'cat2',
    categoryName: '100 ml Perfume',
    size: '100 ml',
    images: [productImages.product7],
    image: productImages.product7,
    description: 'Elite fragrance for the distinguished gentleman.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.9,
    reviews: 780
  },
  {
    _id: '8',
    name: 'Classic Men Cologne 100ml',
    price: 699,
    regularPrice: 699,
    stock: 45,
    inStock: true,
    category: 'cat2',
    categoryName: '100 ml Perfume',
    size: '100 ml',
    images: [productImages.product8],
    image: productImages.product8,
    description: 'Classic cologne with timeless appeal for everyday wear.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.5,
    reviews: 650
  },
  {
    _id: '9',
    name: 'Premium Men Eau de Toilette 100ml',
    price: 699,
    regularPrice: 699,
    stock: 32,
    inStock: true,
    category: 'cat2',
    categoryName: '100 ml Perfume',
    size: '100 ml',
    images: [productImages.productIMG6487],
    image: productImages.productIMG6487,
    description: 'Premium quality eau de toilette with fresh and vibrant notes.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.6,
    reviews: 520
  },
  
  // 30 ml Perfume (imge3) - MRP: Rs 199/-
  {
    _id: '10',
    name: 'Elegant Lady Fragrance 30ml',
    price: 199,
    regularPrice: 199,
    stock: 38,
    inStock: true,
    category: 'cat3',
    categoryName: '30 ml Perfume',
    size: '30 ml',
    images: [productImages.productIMG6503],
    image: productImages.productIMG6503,
    description: 'Elegant and feminine fragrance with floral and fruity notes.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.8,
    reviews: 1250
  },
  {
    _id: '11',
    name: 'Delightful Women Perfume 30ml',
    price: 199,
    regularPrice: 199,
    stock: 42,
    inStock: true,
    category: 'cat3',
    categoryName: '30 ml Perfume',
    size: '30 ml',
    images: [productImages.productIMG9720],
    image: productImages.productIMG9720,
    description: 'Delightful perfume with sweet and captivating scent.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.7,
    reviews: 980
  },
  {
    _id: '12',
    name: 'Luxury Women Eau de Parfum 30ml',
    price: 199,
    regularPrice: 199,
    stock: 25,
    inStock: true,
    category: 'cat3',
    categoryName: '30 ml Perfume',
    size: '30 ml',
    images: [productImages.product2],
    image: productImages.product2,
    description: 'Luxury eau de parfum with exotic and luxurious fragrance.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.9,
    reviews: 720
  },
  {
    _id: '13',
    name: 'Charming Lady Perfume 30ml',
    price: 199,
    regularPrice: 199,
    stock: 35,
    inStock: true,
    category: 'cat3',
    categoryName: '30 ml Perfume',
    size: '30 ml',
    images: [productImages.product3],
    image: productImages.product3,
    description: 'Charming perfume with romantic and alluring scent.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.6,
    reviews: 580
  },
  
  // 20 ml Perfume (imge4) - MRP: Rs 249/-
  {
    _id: '14',
    name: 'Universal Fragrance 20ml',
    price: 249,
    regularPrice: 249,
    stock: 50,
    inStock: true,
    category: 'cat4',
    categoryName: '20 ml Perfume',
    size: '20 ml',
    images: [productImages.unisex1],
    image: productImages.unisex1,
    description: 'Universal fragrance perfect for both men and women.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.7,
    reviews: 1100
  },
  {
    _id: '15',
    name: 'Modern Unisex Perfume 20ml',
    price: 249,
    regularPrice: 249,
    stock: 40,
    inStock: true,
    category: 'cat4',
    categoryName: '20 ml Perfume',
    size: '20 ml',
    images: [productImages.unisex2],
    image: productImages.unisex2,
    description: 'Modern and contemporary unisex fragrance for the bold.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.8,
    reviews: 850
  },
  {
    _id: '16',
    name: 'Versatile Fragrance 20ml',
    price: 249,
    regularPrice: 249,
    stock: 30,
    inStock: true,
    category: 'cat4',
    categoryName: '20 ml Perfume',
    size: '20 ml',
    images: [productImages.unisex3],
    image: productImages.unisex3,
    description: 'Versatile fragrance that adapts to your unique style.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.6,
    reviews: 650
  },
  {
    _id: '17',
    name: 'Premium Unisex Eau de Parfum 20ml',
    price: 249,
    regularPrice: 249,
    stock: 28,
    inStock: true,
    category: 'cat4',
    categoryName: '20 ml Perfume',
    size: '20 ml',
    images: [productImages.unisex4],
    image: productImages.unisex4,
    description: 'Premium quality unisex eau de parfum with balanced notes.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.9,
    reviews: 580
  },
  {
    _id: '18',
    name: 'Contemporary Unisex Scent 20ml',
    price: 249,
    regularPrice: 249,
    stock: 45,
    inStock: true,
    category: 'cat4',
    categoryName: '20 ml Perfume',
    size: '20 ml',
    images: [productImages.unisex5],
    image: productImages.unisex5,
    description: 'Contemporary unisex scent perfect for everyday elegance.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.7,
    reviews: 720
  },
  
  // Pocket Perfume - MRP: Rs 70/-
  {
    _id: '19',
    name: 'Compact Pocket Perfume - Floral',
    price: 70,
    regularPrice: 70,
    stock: 60,
    inStock: true,
    category: 'cat5',
    categoryName: 'Pocket Perfume',
    size: 'Pocket Size',
    images: [productImages.productIMG6487],
    image: productImages.productIMG6487,
    description: 'Compact pocket perfume perfect for on-the-go freshness. Floral fragrance.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.5,
    reviews: 450
  },
  {
    _id: '20',
    name: 'Compact Pocket Perfume - Citrus',
    price: 70,
    regularPrice: 70,
    stock: 55,
    inStock: true,
    category: 'cat5',
    categoryName: 'Pocket Perfume',
    size: 'Pocket Size',
    images: [productImages.productIMG6503],
    image: productImages.productIMG6503,
    description: 'Compact pocket perfume with refreshing citrus notes.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.4,
    reviews: 380
  },
  {
    _id: '21',
    name: 'Compact Pocket Perfume - Woody',
    price: 70,
    regularPrice: 70,
    stock: 50,
    inStock: true,
    category: 'cat5',
    categoryName: 'Pocket Perfume',
    size: 'Pocket Size',
    images: [productImages.productIMG9720],
    image: productImages.productIMG9720,
    description: 'Compact pocket perfume with elegant woody fragrance.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.6,
    reviews: 320
  },
  
  // Room Spray - MRP: Rs 219/-
  {
    _id: '22',
    name: 'Fresh Room Spray - Lavender',
    price: 219,
    regularPrice: 219,
    stock: 40,
    inStock: true,
    category: 'cat6',
    categoryName: 'Room Spray',
    size: 'Room Spray',
    images: [productImages.product1],
    image: productImages.product1,
    description: 'Fresh room spray with calming lavender fragrance. Perfect for home ambiance.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.7,
    reviews: 550
  },
  {
    _id: '23',
    name: 'Aromatic Room Spray - Vanilla',
    price: 219,
    regularPrice: 219,
    stock: 38,
    inStock: true,
    category: 'cat6',
    categoryName: 'Room Spray',
    size: 'Room Spray',
    images: [productImages.product2],
    image: productImages.product2,
    description: 'Aromatic room spray with warm vanilla fragrance.',
    isFeatured: true,
    isBestSeller: false,
    isMostLoved: true,
    rating: 4.6,
    reviews: 420
  },
  {
    _id: '24',
    name: 'Citrus Room Spray - Fresh',
    price: 219,
    regularPrice: 219,
    stock: 42,
    inStock: true,
    category: 'cat6',
    categoryName: 'Room Spray',
    size: 'Room Spray',
    images: [productImages.product3],
    image: productImages.product3,
    description: 'Energizing room spray with fresh citrus notes.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.5,
    reviews: 380
  },
  
  // After Shave Lotion - MRP: Rs 199/-
  {
    _id: '25',
    name: 'Cooling After Shave Lotion',
    price: 199,
    regularPrice: 199,
    stock: 35,
    inStock: true,
    category: 'cat7',
    categoryName: 'After Shave Lotion',
    size: 'After Shave',
    images: [productImages.product4],
    image: productImages.product4,
    description: 'Cooling after shave lotion with soothing properties. Reduces irritation.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: false,
    rating: 4.8,
    reviews: 680
  },
  {
    _id: '26',
    name: 'Classic After Shave Lotion',
    price: 199,
    regularPrice: 199,
    stock: 32,
    inStock: true,
    category: 'cat7',
    categoryName: 'After Shave Lotion',
    size: 'After Shave',
    images: [productImages.product5],
    image: productImages.product5,
    description: 'Classic after shave lotion with traditional masculine fragrance.',
    isFeatured: true,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.7,
    reviews: 520
  },
  {
    _id: '27',
    name: 'Premium After Shave Lotion',
    price: 199,
    regularPrice: 199,
    stock: 30,
    inStock: true,
    category: 'cat7',
    categoryName: 'After Shave Lotion',
    size: 'After Shave',
    images: [productImages.product6],
    image: productImages.product6,
    description: 'Premium after shave lotion with moisturizing benefits.',
    isFeatured: false,
    isBestSeller: true,
    isMostLoved: true,
    rating: 4.6,
    reviews: 450
  }
];

export const mockOrders = [
  {
    _id: '1',
    orderId: 'ORD-001',
    customerName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    totalAmount: 1299,
    orderStatus: 'delivered',
    paymentMethod: 'online',
    paymentStatus: 'completed',
    revenueStatus: 'confirmed',
    revenueAmount: 1299,
    cancellationStatus: 'none',
    cancellationRequested: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'Luxury Perfume Gift Set Premium', price: 1299 },
        name: 'Luxury Perfume Gift Set Premium',
        quantity: 1,
        price: 1299
      }
    ]
  },
  {
    _id: '2',
    orderId: 'ORD-002',
    customerName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    totalAmount: 699,
    orderStatus: 'confirmed',
    paymentMethod: 'online',
    paymentStatus: 'completed',
    revenueStatus: 'confirmed',
    revenueAmount: 699,
    cancellationStatus: 'none',
    cancellationRequested: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '456 Park Ave',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'CEO Man Perfume 100ml', price: 699 },
        name: 'CEO Man Perfume 100ml',
        quantity: 1,
        price: 699
      }
    ]
  },
  {
    _id: '3',
    orderId: 'ORD-003',
    customerName: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '1122334455',
    totalAmount: 1998,
    orderStatus: 'processing',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    revenueStatus: 'pending',
    revenueAmount: 0,
    cancellationStatus: 'none',
    cancellationRequested: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '789 Oak Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'Luxury Perfume Gift Set Premium', price: 1299 },
        name: 'Luxury Perfume Gift Set Premium',
        quantity: 1,
        price: 1299
      },
      {
        product: { name: 'CEO Man Perfume 100ml', price: 699 },
        name: 'CEO Man Perfume 100ml',
        quantity: 1,
        price: 699
      }
    ]
  },
  {
    _id: '4',
    orderId: 'ORD-004',
    customerName: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '5566778899',
    totalAmount: 1299,
    orderStatus: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    revenueStatus: 'pending',
    revenueAmount: 0,
    cancellationStatus: 'requested',
    cancellationRequested: true,
    cancellationReason: 'Changed my mind, want to order something else',
    cancellationRequestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    address: {
      street: '321 Pine Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'Luxury Perfume Gift Set Premium', price: 1299 },
        name: 'Luxury Perfume Gift Set Premium',
        quantity: 1,
        price: 1299
      }
    ]
  },
  {
    _id: '5',
    orderId: 'ORD-005',
    customerName: 'David Brown',
    email: 'david@example.com',
    phone: '9988776655',
    totalAmount: 1398,
    orderStatus: 'shipped',
    paymentMethod: 'online',
    paymentStatus: 'completed',
    revenueStatus: 'confirmed',
    revenueAmount: 1398,
    cancellationStatus: 'none',
    cancellationRequested: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '654 Elm Street',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'CEO Man Perfume 100ml', price: 699 },
        name: 'CEO Man Perfume 100ml',
        quantity: 2,
        price: 1398
      }
    ]
  },
  {
    _id: '6',
    orderId: 'ORD-006',
    customerName: 'Emily Davis',
    email: 'emily@example.com',
    phone: '3344556677',
    totalAmount: 199,
    orderStatus: 'delivered',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    revenueStatus: 'earned',
    revenueAmount: 199,
    cancellationStatus: 'none',
    cancellationRequested: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '987 Maple Avenue',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'Elegant Lady Fragrance 30ml', price: 199 },
        name: 'Elegant Lady Fragrance 30ml',
        quantity: 1,
        price: 199
      }
    ]
  },
  {
    _id: '7',
    orderId: 'ORD-007',
    customerName: 'Robert Wilson',
    email: 'robert@example.com',
    phone: '8877665544',
    totalAmount: 249,
    orderStatus: 'delivered',
    paymentMethod: 'online',
    paymentStatus: 'completed',
    revenueStatus: 'confirmed',
    revenueAmount: 249,
    cancellationStatus: 'approved',
    cancellationRequested: true,
    cancellationReason: 'Product not as expected',
    cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    refundStatus: 'completed',
    refundAmount: 249,
    refundCompletedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    address: {
      street: '111 Rose Garden',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001',
      country: 'India'
    },
    items: [
      {
        product: { name: 'Universal Fragrance 20ml', price: 249 },
        name: 'Universal Fragrance 20ml',
        quantity: 1,
        price: 249
      }
    ]
  }
];

export const mockCategories = [
  {
    _id: 'cat1',
    name: 'Gift Sets',
    description: 'Premium perfume gift sets for special occasions - Rs 1299/-',
    image: categoryImages.giftSets,
    categoryType: 'main',
    mrp: 1299
  },
  {
    _id: 'cat2',
    name: '100 ml Perfume',
    description: 'Premium perfumes in 100ml size - Rs 699/-',
    image: categoryImages.mensPerfume,
    categoryType: 'main',
    mrp: 699
  },
  {
    _id: 'cat3',
    name: '30 ml Perfume',
    description: 'Compact perfumes in 30ml size - Rs 199/-',
    image: categoryImages.womensPerfume,
    categoryType: 'main',
    mrp: 199
  },
  {
    _id: 'cat4',
    name: '20 ml Perfume',
    description: 'Travel-friendly perfumes in 20ml size - Rs 249/-',
    image: categoryImages.unisexPerfume,
    categoryType: 'main',
    mrp: 249
  },
  {
    _id: 'cat5',
    name: 'Pocket Perfume',
    description: 'Convenient pocket-sized perfumes - Rs 70/-',
    image: categoryImages.mensPerfume,
    categoryType: 'main',
    mrp: 70
  },
  {
    _id: 'cat6',
    name: 'Room Spray',
    description: 'Fragrant room sprays for home - Rs 219/-',
    image: categoryImages.unisexPerfume,
    categoryType: 'main',
    mrp: 219
  },
  {
    _id: 'cat7',
    name: 'After Shave Lotion',
    description: 'Soothing after shave lotions - Rs 199/-',
    image: categoryImages.mensPerfume,
    categoryType: 'main',
    mrp: 199
  }
];

export const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main Street, Mumbai, Maharashtra 400001',
    isActive: true,
    googleId: null,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days ago
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    address: '456 Park Avenue, Delhi, Delhi 110001',
    isActive: true,
    googleId: 'google123',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
  },
  {
    _id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '1122334455',
    address: '789 Oak Street, Bangalore, Karnataka 560001',
    isActive: true,
    googleId: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  },
  {
    _id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '5566778899',
    address: '321 Pine Road, Pune, Maharashtra 411001',
    isActive: false,
    googleId: 'google456',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  },
  {
    _id: '5',
    name: 'David Brown',
    email: 'david@example.com',
    phone: '9988776655',
    address: '654 Elm Street, Hyderabad, Telangana 500001',
    isActive: true,
    googleId: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    _id: '6',
    name: 'Emily Davis',
    email: 'emily@example.com',
    phone: '3344556677',
    address: '987 Maple Avenue, Chennai, Tamil Nadu 600001',
    isActive: true,
    googleId: 'google789',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  }
];

export const mockHeroCarousel = [
  {
    _id: '1',
    title: 'Summer Collection',
    subtitle: 'New Arrivals',
    image: 'https://via.placeholder.com/800x400',
    link: '/products',
    isActive: true,
    order: 1
  }
];

export const mockCoupons = [
  {
    _id: '1',
    code: 'SUMMER20',
    discountValue: 20,
    discountPercentage: 20,
    discountType: 'percentage',
    minPurchase: 500,
    minOrderAmount: 500,
    maxDiscount: 200,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    usageLimit: 100,
    maxUses: 100,
    usedCount: 25
  },
  {
    _id: '2',
    code: 'WINTER30',
    discountValue: 30,
    discountPercentage: 30,
    discountType: 'percentage',
    minPurchase: 1000,
    minOrderAmount: 1000,
    maxDiscount: 500,
    validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    usageLimit: 50,
    maxUses: 50,
    usedCount: 15
  },
  {
    _id: '3',
    code: 'NEWUSER',
    discountValue: 15,
    discountPercentage: 15,
    discountType: 'percentage',
    minPurchase: 300,
    minOrderAmount: 300,
    maxDiscount: 150,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    usageLimit: 200,
    maxUses: 200,
    usedCount: 45
  }
];

export const mockBlogs = [
  {
    _id: '1',
    title: 'How to Choose the Right Perfume',
    content: 'Complete guide to selecting perfumes...',
    image: 'https://via.placeholder.com/600x400',
    author: 'Admin',
    publishedAt: new Date().toISOString(),
    isPublished: true
  }
];

export const mockAnnouncements = [
  {
    _id: '1',
    title: 'New Collection Launch',
    message: 'Check out our new summer collection',
    type: 'info',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const mockWishlists = [
  {
    _id: '1',
    userId: '1',
    userName: 'John Doe',
    products: [
      { _id: '1', name: 'Luxury Perfume', price: 549 }
    ],
    createdAt: new Date().toISOString()
  }
];

export const mockPayments = [
  {
    _id: '1',
    orderId: 'ORD-001',
    customerName: 'John Doe',
    amount: 999,
    method: 'online',
    status: 'success',
    createdAt: new Date().toISOString()
  }
];

export const mockRefunds = [
  {
    _id: '1',
    orderId: 'ORD-001',
    customerName: 'John Doe',
    refundAmount: 999,
    refundStatus: 'pending',
    refundInitiatedAt: new Date().toISOString()
  }
];

export const mockSupportQueries = [
  {
    _id: '1',
    userName: 'John Doe',
    email: 'john@example.com',
    subject: 'Order Issue',
    message: 'My order is delayed',
    status: 'open',
    createdAt: new Date().toISOString()
  }
];

// Mock Admin User
export const mockAdminUser = {
  _id: 'admin1',
  username: 'admin',
  email: 'admin@vintagebeauty.com',
  role: 'admin',
  lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
};

// Mock Settings
export const mockSettings = [];

