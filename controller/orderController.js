import Order from "../model/orderModel.js";
import Product from "../model/productModel.js"; 
import User from "../model/model.js";
import { Admin } from "../model/adminModel.js";


export const createOrder = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user info missing',
      });
    }

    const { items, shippingAddress, customerInfo } = req.body;
    const userId = req.user._id;

    // ✅ Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required',
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Process each item
    for (const item of items) {
      let product;
      
      try {
        console.log(`Finding product with ID: ${item.productId}`);
        
        // Look up product by pid field (custom product ID) first, then fallback to _id
        if (item.productId) {
          // Try by pid first
          product = await Product.findOne({ pid: item.productId });
          console.log(`Search by pid result: ${product ? 'Found' : 'Not found'}`);
          
          // If not found by pid, try by _id
          if (!product) {
            console.log(`Attempting to find by _id: ${item.productId}`);
            try {
              product = await Product.findById(item.productId);
              console.log(`Search by _id result: ${product ? 'Found' : 'Not found'}`);
            } catch (idError) {
              console.error(`Error finding by _id: ${idError.message}`);
            }
          }
        }
        
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found. Please check the product ID.`,
          });
        }

        // Check stock availability
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Only ${product.stock} available`,
          });
        }

        // Calculate item total and add to order
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          quantity: item.quantity,
          price: product.price,
          totalPrice: itemTotal,
        });

        // Update product stock
        product.stock -= item.quantity;
        await product.save();
        
      } catch (error) {
        console.error(`Error processing product ${item.productId}:`, error.message);
        return res.status(500).json({
          success: false,
          message: `Error processing product: ${error.message}`,
        });
      }
    }

    const shippingCost = totalAmount >= 499 ? 0 : 50;
  const roundedTotalAmount = Math.round(totalAmount);
  const finalAmount = Math.round(roundedTotalAmount + shippingCost);

    const order = new Order({
      userId,
      userDetails: {
        name: user.name,
        email: user.email,
        phone: customerInfo?.phone || user.phone || ''  // Try customerInfo first, then user profile, then empty
      },
      items: orderItems,
      totalAmount: roundedTotalAmount,
      shippingCost,
      finalAmount: finalAmount,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'completed',
    });

    console.log('Creating order with userDetails:', {
      name: user.name,
      email: user.email,
      phone: customerInfo?.phone || user.phone || ''
    });
  
    await order.save();
    await order.populate('userId', 'name email');

    // Emit new order event to admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-order', {
        orderId: order._id,
        customerName: order.userDetails.name,
        totalAmount: order.finalAmount,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted for new order');
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    // ✅ Enhanced error logging
    console.error('Create order error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating order',
    });
  }
};


// Get user's order history
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate('items.productId', 'name image category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ userId });

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Create new order for guest checkout (no authentication required)
export const createGuestOrder = async (req, res) => {
  try {

    const { 
      customerInfo, 
      items, 
      paymentMethod, 
      subtotal, 
      shipping, 
      total,
      // Alternative structure (from transformation)
      shippingAddress: incomingAddress,
      totalAmount,
      shippingCost,
      finalAmount,
      userDetails
    } = req.body;

    // Use the correct items array
    const orderItemsArray = items || req.body.items;
    
    // Validate required fields with flexible structure
    if (!orderItemsArray || !Array.isArray(orderItemsArray) || orderItemsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Extract customer info from either structure
    const custInfo = customerInfo || userDetails;
    if (!custInfo) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    // Create shipping address from either structure
    const shippingAddress = incomingAddress || {
      street: custInfo.address,
      city: custInfo.city,
      state: custInfo.state,
      zipCode: custInfo.zipCode || custInfo.zip,
      country: 'India' // Default country
    };

    // Get customer details in a consistent format
    const customerDetails = {
      name: custInfo.fullName || custInfo.name,
      email: custInfo.email,
      phone: custInfo.phone
    };

    // Log what we're working with for debugging
    console.log("Processing order with:", {
      customerDetails,
      shippingAddress,
      itemCount: orderItemsArray.length
    });

    // Format order items to match backend structure
    const orderItems = orderItemsArray.map(item => {
      // Calculate the total price for each item
      const itemPrice = parseFloat(item.price);
      const itemQty = parseInt(item.quantity);
      const itemTotal = itemPrice * itemQty;
      
      return {
        productId: item.productId || item.id || item._id, // Support all ID formats
        productName: item.name || item.productName,
        productImage: item.image || item.productImage || "https://via.placeholder.com/150",
        quantity: itemQty,
        price: itemPrice,
        totalPrice: itemTotal
      };
    });

    // Calculate order totals if not provided
  const calculatedSubtotal = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const calculatedShipping = (calculatedSubtotal > 499) ? 0 : 50;
  const calculatedTotal = calculatedSubtotal + calculatedShipping;
    
    // Create order with the appropriate values, using provided values or calculated ones
    const order = new Order({  
      // If guest, we don't have userId
      userDetails: customerDetails,
      items: orderItems,
      totalAmount: totalAmount || subtotal || calculatedSubtotal,
      shippingCost: shippingCost || shipping || calculatedShipping,
      finalAmount: finalAmount || total || calculatedTotal,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod', // Default to cash on delivery
      status: 'pending',
      isGuest: true // Flag this as a guest order
    });

    console.log("Saving order:", {
      items: orderItems.length,
      total: order.finalAmount,
      address: order.shippingAddress
    });

    await order.save();

    // Emit new order event to admins for guest orders
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-order', {
        orderId: order._id,
        customerName: order.userDetails.name,
        totalAmount: order.finalAmount,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted for new guest order');
    }

    // Generate a more user-friendly order ID
    const friendlyOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderId: friendlyOrderId,
      _id: order._id
    });
  } catch (error) {
    console.error('Create guest order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating guest order'
    });
  }
};

// Get single order details
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }], 
      userId 
    })
    .populate('items.productId', 'name image category')
    .populate('userId', 'name email')
    .populate('approvedBy', 'username');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'userDetails.name': { $regex: search, $options: 'i' } },
        { 'userDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('items.productId', 'name image category') // Populate product details
      .populate('userId', 'name email phone') // Also populate phone from user
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Debug: Log phone numbers in orders
    // console.log('Orders fetched for admin:');
    // orders.forEach((order, index) => {
    //   console.log(`Order ${index + 1}:`, {
    //     id: order._id,
    //     userDetailsPhone: order.userDetails?.phone,
    //     userIdPhone: order.userId?.phone,
    //     finalPhone: order.userDetails?.phone || order.userId?.phone || 'N/A'
    //   });
    // });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Admin: Approve order
export const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }] 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be approved'
      });
    }

    order.status = 'approved';
    order.approvedBy = adminId;
    order.approvedAt = new Date();
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    await order.save();
    await order.populate('approvedBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Order approved successfully',
      order
    });

  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving order'
    });
  }
};

// Admin: Reject order
export const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const order = await Order.findOne({ 
      $or: [{ _id: orderId }, { orderId: orderId }] 
    }).populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be rejected'
      });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'rejected';
    order.approvedBy = adminId;
    order.approvedAt = new Date();
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    await order.save();
    await order.populate('approvedBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Order rejected successfully',
      order
    });

  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting order'
    });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    console.log('=== UPDATE ORDER STATUS DEBUG ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.user ? { id: req.user._id, username: req.user.username } : 'No user');
    
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!id) {
      console.log('❌ No order ID provided');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    if (!status) {
      console.log('❌ No status provided');
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    if (!req.user || !req.user._id) {
      console.log('❌ No authenticated user');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const adminId = req.user._id;

    // Map frontend status values to backend enum values
    const statusMapping = {
      'Pending': 'pending',
      'Processing': 'approved', // Map Processing to approved since that's what backend uses
      'Shipped': 'shipped',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };

    const validFrontendStatuses = Object.keys(statusMapping);
    const backendStatus = statusMapping[status];
    
    console.log('Received status:', status, 'Mapped to:', backendStatus);
    
    if (!validFrontendStatuses.includes(status)) {
      console.log('❌ Invalid status provided:', status);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validFrontendStatuses.join(', ')}`
      });
    }

    console.log('🔍 Searching for order with ID:', id);
    const order = await Order.findOne({ 
      $or: [{ _id: id }, { orderId: id }] 
    });

    if (!order) {
      console.log('❌ Order not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order found:', { id: order._id, currentStatus: order.status });

    order.status = backendStatus; // Use the mapped backend status
    order.approvedBy = adminId;
    order.approvedAt = new Date();
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    console.log('💾 Saving order with new status:', backendStatus);
    await order.save();
    await order.populate('approvedBy', 'name email');

    console.log('✅ Order status updated successfully');
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('order-status-updated', {
        orderId: order._id,
        newStatus: backendStatus,
        orderNumber: order._id.toString().slice(-6),
        adminId: adminId,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted for order status update');
    }
    
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// Cancel order function for users
export const cancelOrder = async (req, res) => {
  try {
    console.log('=== CANCEL ORDER DEBUG ===');
    console.log('Params:', req.params);
    console.log('User:', req.user ? { id: req.user._id, username: req.user.username } : 'No user');
    
    const { id } = req.params;
    
    if (!id) {
      console.log('❌ No order ID provided');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    if (!req.user || !req.user._id) {
      console.log('❌ No authenticated user');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user._id;

    console.log('🔍 Searching for order with ID:', id);
    const order = await Order.findOne({ 
      $or: [{ _id: id }, { orderId: id }] 
    });

    if (!order) {
      console.log('❌ Order not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if the order belongs to the user (for security)
    if (order.userId && order.userId.toString() !== userId.toString()) {
      console.log('❌ Order does not belong to user');
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders'
      });
    }

    // Check if order can be cancelled (only pending or approved orders can be cancelled)
    if (!['pending', 'approved'].includes(order.status)) {
      console.log('❌ Order cannot be cancelled, current status:', order.status);
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    console.log('✅ Order found and can be cancelled:', { id: order._id, currentStatus: order.status });

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancelledBy = userId;
    order.cancelledAt = new Date();

    console.log('💾 Saving cancelled order');
    await order.save();

    console.log('✅ Order cancelled successfully');
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
};
