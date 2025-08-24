import mongoose from "mongoose";

// Individual order item schema
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

// Main order schema
const orderSchema = new mongoose.Schema({
  // Simple order ID generation
  orderId: {
    type: String,
    default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  
  // Order number for MongoDB index compatibility
  orderNumber: {
    type: String,
    unique: true,
    default: () => `ORDER-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'signups',
    required: false // Make optional for guest checkout
  },
  userDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String } // Add phone for guest orders
  },
  
  // Flag for guest checkout
  isGuest: {
    type: Boolean,
    default: false
  },

  // Order items
  items: [orderItemSchema],

  // Pricing details
  // totalAmount: {
  //   type: Number,
  //   required: true
  // },
  // shippingCost: {
  //   type: Number,
  //   default: 0
  // },
  // finalAmount: {
  //   type: Number,
  //   required: true
  // },

  totalAmount: { type: Number, required: true, set: v => Math.round(v) },
  shippingCost: { type: Number, set: v => Math.round(v) },
  finalAmount: { type: Number, required: true, set: v => Math.round(v) },
  // Shipping address
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card'],
    default: 'cod'
  },

  // Admin actions
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'signups' // Reference the User model
  },
  approvedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  
  // Cancellation info
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'signups'
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
