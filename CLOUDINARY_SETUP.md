# Cloudinary Integration Setup

This project now supports Cloudinary for handling new product images while maintaining backward compatibility with existing image URLs.

## Features

- ✅ **Backward Compatible**: All existing image URLs in the database remain functional
- ✅ **New Product Images**: Admin can upload images that are automatically stored in Cloudinary
- ✅ **Image Optimization**: Cloudinary automatically optimizes images (resize, compress, format conversion)
- ✅ **Clean Deletion**: When products with Cloudinary images are deleted, images are also removed from Cloudinary
- ✅ **Graceful Fallback**: Works even if Cloudinary is not configured

## Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the Dashboard
3. Update the `.env` file with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## How It Works

### For New Products (Admin Panel)
- When admin uploads an image file, it's automatically uploaded to Cloudinary
- The Cloudinary URL is stored in the database
- Images are optimized (max 800x800px, auto quality, auto format)

### For Existing Products
- All existing image URLs continue to work normally
- No changes needed for existing data
- When updating existing products, you can:
  - Upload a new image (replaces with Cloudinary URL)
  - Keep existing URL
  - Provide a new URL manually

### Image Management
- **Create**: Upload file → Cloudinary → Store URL in DB
- **Update**: 
  - If uploading new file → Delete old Cloudinary image (if applicable) → Upload new → Update DB
  - If providing URL → Keep URL in DB
- **Delete**: Delete from DB → Delete from Cloudinary (if it's a Cloudinary URL)

## File Structure

```
backend/
├── config/
│   └── cloudinary.js          # Cloudinary configuration and utilities
├── controller/
│   └── productController.js   # Updated with Cloudinary integration
├── routes/
│   └── productRoutes.js       # Updated routes with file upload
└── .env                       # Environment variables (add Cloudinary credentials)
```

## API Usage

### Create Product with Image Upload
```javascript
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('description', 'Product Description');
formData.append('price', '99.99');
formData.append('category', 'Category');
formData.append('stock', '100');
formData.append('weight', '250g');
formData.append('image', imageFile); // File object

fetch('/api/products/add', {
  method: 'POST',
  body: formData
});
```

### Create Product with URL (Backward Compatible)
```javascript
fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Product Name',
    description: 'Product Description',
    price: 99.99,
    category: 'Category',
    stock: 100,
    weight: '250g',
    image: 'https://example.com/image.jpg' // Existing URL
  })
});
```

## Benefits

1. **Performance**: Cloudinary CDN delivers images faster worldwide
2. **Optimization**: Automatic image compression and format conversion
3. **Scalability**: No need to store images on your server
4. **Flexibility**: Supports both new uploads and existing URLs
5. **Clean Storage**: Automatic cleanup when products are deleted
