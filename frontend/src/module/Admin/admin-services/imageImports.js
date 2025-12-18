// Image imports for mock data
// Importing all product images from assets folder

// Product images from assets folder
import product1 from '../../../assets/1.jpg';
import product2 from '../../../assets/2.jpg';
import product2_1 from '../../../assets/2_1.jpg';
import product3 from '../../../assets/3.jpg';
import product3_1 from '../../../assets/3_1.jpg';
import product4 from '../../../assets/4.jpg';
import product4_1 from '../../../assets/4_1.jpg';
import product4_2 from '../../../assets/4----2.jpg';
import product5 from '../../../assets/5.jpg';
import product5_1 from '../../../assets/5_1.jpg';
import product6 from '../../../assets/6.jpg';
import product7 from '../../../assets/7.jpg';
import product8 from '../../../assets/8-222.jpg';
import productIMG6487 from '../../../assets/IMG_6487.jpg';
import productIMG6503 from '../../../assets/IMG_6503.jpg';
import productIMG9720 from '../../../assets/IMG_9720.JPG';

// Export image mappings
export const productImages = {
  // Product 1
  product1: product1,
  
  // Product 2 - has 2 images
  product2: product2,
  product2_1: product2_1,
  
  // Product 3 - has 2 images
  product3: product3,
  product3_1: product3_1,
  
  // Product 4 - has 3 images
  product4: product4,
  product4_1: product4_1,
  product4_2: product4_2,
  
  // Product 5 - has 2 images
  product5: product5,
  product5_1: product5_1,
  
  // Product 6
  product6: product6,
  
  // Product 7
  product7: product7,
  
  // Product 8
  product8: product8,
  
  // Additional images
  productIMG6487: productIMG6487,
  productIMG6503: productIMG6503,
  productIMG9720: productIMG9720,
  
  // Legacy mappings for backward compatibility (using product images)
  gift1_1: product1,
  gift1_2: product2,
  gift2_1: product3,
  gift2_2: product4,
  gift3_1: product5,
  gift4_1: product6,
  
  mens1: product7,
  mens2: product8,
  mens3: productIMG6487,
  mens4: productIMG6503,
  mens5: productIMG9720,
  
  womens1: product2,
  womens2: product3,
  womens3: product4,
  womens4: product5,
  
  unisex1: product6,
  unisex2: product7,
  unisex3: product8,
  unisex4: productIMG6487,
  unisex5: productIMG6503
};

// Category images
export const categoryImages = {
  giftSets: product1,
  mensPerfume: product7,
  womensPerfume: product2,
  unisexPerfume: product6
};
