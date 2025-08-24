import Product from '../model/productModel.js';
import mongoose from 'mongoose';
import { deleteFromCloudinary, extractPublicId } from '../config/cloudinary.js';

// Get all products with pagination and filtering
export const getProducts = async (req, res) => {
  try {
    console.log('📡 GET /api/products - Request received');
    console.log('📡 Query params:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const [field, order] = req.query.sortBy.split(':');
      sort[field] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    console.log(`📦 Found ${total} total products, returning ${products.length} products`);
    console.log('📦 Products preview:', products.slice(0, 2).map(p => ({ name: p.name, category: p.category })));

    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// Get a single product by ID
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    console.log('📝 POST /api/products - Creating product');
    console.log('📝 Request body:', req.body);
    console.log('📝 Request file:', req.file);
    
    // Create product data
    const productData = {
      ...req.body,
      addedBy: req.user ? req.user.id : new mongoose.Types.ObjectId() // Use a default ObjectId if no user
    };
    
    // Handle features - multer receives array items as req.body['features[]']
    if (req.body['features[]']) {
      productData.features = Array.isArray(req.body['features[]']) 
        ? req.body['features[]'] 
        : [req.body['features[]']];
    } else {
      productData.features = [];
    }
    
    // Handle image - either from Cloudinary upload or existing URL
    if (req.file) {
      // New image uploaded via Cloudinary
      productData.image = req.file.path;
      console.log('📷 Using Cloudinary image:', req.file.path);
    } else if (req.body.image) {
      // Existing URL provided (for backward compatibility)
      productData.image = req.body.image;
      console.log('📷 Using existing image URL:', req.body.image);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Product image is required (either upload a file or provide image URL)'
      });
    }
    
    const product = new Product(productData);

    console.log('📝 Product object before save:', product);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      product: savedProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('❌ Error details:', error.message);
    
    // If there was an error and we uploaded a new image to Cloudinary, delete it
    if (req.file && req.file.public_id) {
      try {
        await deleteFromCloudinary(req.file.public_id);
        console.log('🗑️ Deleted uploaded image from Cloudinary due to error');
      } catch (deleteError) {
        console.error('❌ Error deleting image from Cloudinary:', deleteError);
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      console.error('❌ Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle image updates
    if (req.file) {
      // New image uploaded via Cloudinary
      // Only delete old image if it's from Cloudinary (contains 'cloudinary.com')
      if (product.image && product.image.includes('cloudinary.com')) {
        try {
          const publicId = extractPublicId(product.image);
          await deleteFromCloudinary(publicId);
          console.log('🗑️ Deleted old Cloudinary image');
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old Cloudinary image:', deleteError.message);
        }
      }
      
      // Set new Cloudinary image URL
      updateData.image = req.file.path;
      console.log('📷 Updated with new Cloudinary image:', req.file.path);
    } else if (req.body.image && req.body.image !== product.image) {
      // Image URL provided in body (for existing URLs or manual updates)
      // Only delete old image if it's from Cloudinary
      if (product.image && product.image.includes('cloudinary.com')) {
        try {
          const publicId = extractPublicId(product.image);
          await deleteFromCloudinary(publicId);
          console.log('🗑️ Deleted old Cloudinary image when updating with URL');
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old Cloudinary image:', deleteError.message);
        }
      }
      updateData.image = req.body.image;
      console.log('📷 Updated with provided image URL:', req.body.image);
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // If there was an error and we uploaded a new image to Cloudinary, delete it
    if (req.file && req.file.public_id) {
      try {
        await deleteFromCloudinary(req.file.public_id);
        console.log('🗑️ Deleted uploaded image from Cloudinary due to error');
      } catch (deleteError) {
        console.error('❌ Error deleting image from Cloudinary:', deleteError);
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Only delete image from Cloudinary if it's a Cloudinary URL
    if (product.image && product.image.includes('cloudinary.com')) {
      try {
        const publicId = extractPublicId(product.image);
        await deleteFromCloudinary(publicId);
        console.log('🗑️ Deleted product image from Cloudinary');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete image from Cloudinary:', deleteError.message);
      }
    } else if (product.image) {
      console.log('📷 Keeping existing image URL (not from Cloudinary):', product.image);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      totalProducts,
      categoryCounts: categoryStats.map(stat => ({ 
        category: stat._id, 
        count: stat.count 
      }))
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting product statistics'
    });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity && quantity !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.stock = quantity;
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: 'Product stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product stock'
    });
  }
};

// Process bulk purchase of products
export const processPurchase = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid items array is required'
      });
    }

    const results = [];
    const errors = [];
    
    // Process each item in the purchase
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || quantity === undefined) {
        errors.push({
          productId: productId || 'unknown',
          message: 'Missing productId or quantity'
        });
        continue;
      }

      try {
        const product = await Product.findById(productId);
        
        if (!product) {
          errors.push({
            productId,
            message: 'Product not found'
          });
          continue;
        }

        if (product.stock < quantity) {
          errors.push({
            productId,
            message: `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}`
          });
          continue;
        }

        // Update stock
        product.stock -= quantity;
        await product.save();

        results.push({
          productId,
          name: product.name,
          quantityPurchased: quantity,
          newStock: product.stock
        });
        
      } catch (err) {
        errors.push({
          productId,
          message: `Error processing item: ${err.message}`
        });
      }
    }

    const response = {
      success: errors.length === 0,
      results: results,
      errors: errors
    };

    res.status(errors.length === 0 ? 200 : 207).json(response); // 207 Multi-Status for partial success

  } catch (error) {
    console.error('Process purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing purchase'
    });
  }
};
