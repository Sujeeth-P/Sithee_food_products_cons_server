import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary only if credentials are provided
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️ Cloudinary not configured - missing environment variables');
}

// Configure Cloudinary storage for multer
const storage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sithee-products', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Resize images
      { quality: 'auto' }, // Auto quality optimization
      { fetch_format: 'auto' } // Auto format selection
    ]
  }
}) : null;

// Create multer upload middleware
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only image files'), false);
    }
  }
});

// Function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured) {
    console.warn('⚠️ Cannot delete from Cloudinary - not configured');
    return { result: 'not_configured' };
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Function to extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Handle nested folders in public ID
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
      const folderParts = parts.slice(uploadIndex + 2, -1); // Skip version number if present
      if (folderParts.length > 0) {
        return folderParts.join('/') + '/' + publicId;
      }
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', url, error);
    return null;
  }
};

export { isCloudinaryConfigured };
export default cloudinary;
