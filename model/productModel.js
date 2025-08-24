import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Product full name is required'],
    trim: true,
    maxlength: [200, 'Full name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  weight: {
    type: String,
    required: [true, 'Product weight is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['Flour Products', 'Rava & Sooji', 'Noodles & Vermicelli', 'Gram Flour Varieties', 'Specialty Products'],
      message: 'Please select a valid category'
    }
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  features: [{
    type: String,
    trim: true
  }],
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 100
  },
  pid: {
    type: String,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Generate PID automatically if not provided
productSchema.pre('save', function(next) {
  if (!this.pid) {
    const categoryCode = this.category.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    this.pid = `${categoryCode}-${Date.now()}`;
  }
  next();
});

// Index for search optimization
productSchema.index({ name: 'text', description: 'text', fullName: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ weight: 1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);