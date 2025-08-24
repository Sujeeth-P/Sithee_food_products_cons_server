import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  updateProductStock,
  processPurchase
} from '../controller/productController.js';
import { upload } from '../config/cloudinary.js';

// Middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading image'
      });
    }
    // Continue even if no file was uploaded
    next();
  });
};

const router = express.Router();

// Public routes
router.get('/', getProducts); // This handles filtering by category, search, etc.

// Stats route (must come before :id route)
router.get('/stats', getProductStats);

// Get all products route for admin dashboard
router.get('/all', getProducts);

// Diagnostic endpoint for debugging
router.get('/debug/all', async (req, res) => {
  try {
    // Import the Product model directly
    const Product = await import('../model/productModel.js')
      .then(module => module.default);
      
    console.log('Product model:', Product);
    
    // Get all products with minimal fields for diagnostics
    const allProducts = await Product.find()
      .select('_id pid name price stock')
      .lean();
      
    console.log(`Found ${allProducts.length} products`);
    
    res.json({ 
      count: allProducts.length,
      products: allProducts.map(p => ({
        _id: p._id,
        pid: p.pid || 'No PID',
        name: p.name,
        stock: p.stock,
        price: p.price
      }))
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.get('/:id', getProduct); // Get single product by ID

//Product management routes
router.post('/', optionalUpload, createProduct);
router.post('/add', optionalUpload, createProduct); // Alternative route for admin panel
router.put('/:id', optionalUpload, updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateProductStock);

export default router;
