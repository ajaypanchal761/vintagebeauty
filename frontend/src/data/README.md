# Products Data Structure

This file contains all the organized product information extracted from `deatils.txt`.

## Structure

### 1. Company Information (`companyInfo`)
- Brand details
- Contact information (email, phone, WhatsApp)
- Business addresses

### 2. Pricing (`pricing`)
All product pricing in Indian Rupees:
- 100ml: ₹699
- 20ml: ₹249
- 30ml: ₹199
- Pocket Perfume: ₹70
- Room Spray: ₹219
- After Shave Lotion: ₹199
- Gift Set: ₹1299

### 3. Perfumes (`perfumes`)
Array of 9 perfume products with complete details:
- **Black X** - Sweet-oriental woody fragrance
- **Attarful** - Attar-inspired perfume
- **Man in White** - Classic aromatic fougère (Men)
- **Man @ Black** - Iconic men's fragrance
- **Red Diamond** - Unisex beast fragrance
- **One Million** - Sweet-spicy leather fragrance (Men)
- **Oud** - Deep, woody, smoky fragrance (Unisex)
- **Aqua Fresh** - Fresh aquatic fragrance (Unisex)
- **Party Lover** - Smoky gourmand fragrance (Unisex)

Each perfume includes:
- ID, name, category, type, gender
- Description
- Top, Heart, Base notes
- Performance details (longevity, projection)
- Available sizes with pricing

### 4. Room Sprays (`roomSprays`)
Array of 10 room spray products:
- Jasmine Room Freshener
- Lavender Room Spray
- Rose Room Spray
- Fresh Lime Room Spray
- Petal Crush Pink
- Fresh Lush Green
- Cool Surf Blue
- Misty Morning Meadows
- Violet Valley Bloom
- Musk After Smoke

Each includes features, description, and pricing.

### 5. Other Products (`otherProducts`)
- Pocket Perfume
- After Shave Lotion
- Gift Set

### 6. Categories (`categories`)
Organized category structure with associated products.

## Usage

```javascript
import { perfumes, roomSprays, pricing, companyInfo } from './data/productsData';

// Use in components
const products = perfumes;
const price = pricing["100ml"]; // ₹699
```

## Notes

- All prices are in Indian Rupees (₹)
- Product images should be mapped from `assets/images vintage/` folder
- Each product has a unique ID for routing and identification
- Performance details are included where available

