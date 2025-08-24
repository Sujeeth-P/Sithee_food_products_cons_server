import mongoose from 'mongoose';
import Product from './model/productModel.js';
import Order from './model/orderModel.js';
import User from './model/model.js';
import { Admin } from './model/adminModel.js';
import connectDB from './db/db.js';

// Sample food masala products data
const sampleProducts = [
  {
    pid: 'FP001',
    name: 'Rice Flour',
    fullName: 'Premium Rice Flour - Gluten Free',
    category: 'Flour Products',
    price: 85,
    weight: '500g',
    description: 'Pure, silky-smooth rice flour perfect for crispy dosas, soft idlis, and delicate sweets. Naturally gluten-free for healthy cooking!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503333782/UT/NA/UR/122442363/roasted-vermicelli-250x250.jpeg',
    features: ['Gluten Free', 'Fine Texture', 'Premium Quality'],
    stock: 50,
    isActive: true,
    rating: {
      average: 4.2,
      count: 15
    }
  },
  {
    pid: 'RS002', 
    name: 'Roasted Rava',
    fullName: 'Double Roasted Rava - Premium Quality',
    category: 'Rava & Sooji',
    price: 75,
    weight: '500g',
    description: 'Golden double-roasted rava with rich aroma and texture. Creates fluffy upma, crispy rava dosa, and delicious kesari in minutes!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503334363/JH/HJ/LE/122442363/gram-flour-250x250.jpeg',
    features: ['Double Roasted', 'Quick Cooking', 'Fresh Quality'],
    stock: 65,
    isActive: true,
    rating: {
      average: 4.5,
      count: 22
    }
  },
  {
    pid: 'FP003',
    name: 'Ragi Flour',
    fullName: 'Organic Ragi Flour - Finger Millet',
    category: 'Flour Products',
    price: 95,
    weight: '500g',
    description: 'Nutrient-packed organic ragi flour loaded with calcium and iron. Perfect for healthy rotis, porridge, and baby food!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503333979/MS/BN/GX/122442363/double-roasted-rava-sooji-250x250.jpeg',
    features: ['Organic', 'High Calcium', 'Nutritious'],
    stock: 40,
    isActive: true,
    rating: {
      average: 4.3,
      count: 18
    }
  },
  {
    pid: 'FP004',
    name: 'Wheat Flour',
    fullName: 'Chakki Fresh Atta - Premium Wheat Flour',
    category: 'Flour Products',
    price: 120,
    weight: '500g',
    description: 'Traditional stone-ground chakki atta that makes soft, fluffy rotis every time. Fresh-milled for maximum nutrition and taste!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503334512/HC/XO/FJ/122442363/wheat-flour-250x250.jpeg',
    features: ['Chakki Fresh', 'High Fiber', 'Premium Quality'],
    stock: 80,
    isActive: true,
    rating: {
      average: 4.6,
      count: 35
    }
  },
  {
    pid: 'NV005',
    name: 'Hakka Noodles',
    fullName: 'Vegetable Hakka Noodles - Ready to Cook',
    category: 'Noodles & Vermicelli',
    price: 180,
    weight: '1kg',
    description: 'Restaurant-style hakka noodles bursting with vegetable flavors. Quick 5-minute cooking for delicious family meals!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503332953/XI/NE/WD/122442363/bajji-bonda-powder-250x250.jpeg',
    features: ['Vegetable Flavor', 'Quick Cooking', 'Family Pack'],
    stock: 35,
    isActive: true,
    rating: {
      average: 4.1,
      count: 12
    }
  },
  {
    pid: 'RS006',
    name: 'Sooji',
    fullName: 'Double Roasted Sooji - Fine Semolina',
    category: 'Rava & Sooji',
    price: 60,
    weight: '200g',
    description: 'Fine, golden sooji with perfect texture for instant upma, halwa, and savory snacks. Double-roasted for enhanced flavor!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503332807/OH/ZZ/IT/122442363/double-roasted-rava-250x250.jpeg',
    features: ['Double Roasted', 'Fine Quality', 'Ideal for Upma'],
    stock: 70,
    isActive: true,
    rating: {
      average: 4.4,
      count: 28
    }
  },
  {
    pid: 'FP007',
    name: 'Organic Wheat',
    fullName: 'Organic Samba Rava - Traditional Wheat',
    category: 'Flour Products',
    price: 110,
    weight: '500g',
    description: 'Premium organic wheat processed the traditional way. Chemical-free and pure for wholesome, healthy family meals!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503332086/UJ/JT/CW/122442363/gram-flour-250x250.jpeg',
    features: ['Organic', 'Traditional Processing', 'Chemical Free'],
    stock: 45,
    isActive: true,
    rating: {
      average: 4.7,
      count: 20
    }
  },
  {
    pid: 'FP008',
    name: 'Corn Flour',
    fullName: 'Premium Corn Flour - Maize Starch',
    category: 'Flour Products',
    price: 140,
    weight: '1kg',
    description: 'Ultra-fine corn flour perfect for crispy coatings, smooth gravies, and delectable desserts. Multi-purpose kitchen essential!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503333432/QA/UX/MM/122442363/gram-savoury-flour-250x250.jpeg',
    features: ['Fine Texture', 'Multipurpose', 'Premium Quality'],
    stock: 30,
    isActive: true,
    rating: {
      average: 4.0,
      count: 14
    }
  },
  {
    pid: 'SP009',
    name: 'Jaggery Powder',
    fullName: 'Organic Jaggery Powder - Natural Sweetener',
    category: 'Specialty Products',
    price: 125,
    weight: '500g',
    description: 'Pure organic jaggery powder with rich, earthy sweetness. Natural alternative to sugar for healthy desserts and drinks!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503334223/DJ/DC/XQ/122442363/appalam-papad-250x250.jpeg',
    features: ['Organic', 'Natural Sweetener', 'Chemical Free'],
    stock: 25,
    isActive: true,
    rating: {
      average: 4.8,
      count: 31
    }
  },
  {
    pid: 'SP010',
    name: 'Appalam Papad',
    fullName: 'Traditional Appalam Papad - Ready to Fry',
    category: 'Specialty Products',
    price: 55,
    weight: '100g',
    description: 'Handcrafted traditional appalam that puffs into crispy, golden perfection. Authentic taste that brings back childhood memories!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503335099/EJ/KP/UT/122442363/organic-ragi-flour-250x250.jpeg',
    features: ['Traditional Recipe', 'Handmade', 'Ready to Fry'],
    stock: 60,
    isActive: true,
    rating: {
      average: 4.3,
      count: 19
    }
  },
  {
    pid: 'NV011',
    name: 'Vermicelli Noodle',
    fullName: 'Roasted Vermicelli - Premium Quality',
    category: 'Noodles & Vermicelli',
    price: 45,
    weight: '150g',
    description: 'Pre-roasted vermicelli with golden color and nutty aroma. Perfect for quick upma, sweet payasam, and savory pulao!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503332415/FR/GT/XW/122442363/natural-maida-flour-500x500.jpeg',
    features: ['Pre-roasted', 'Quick Cooking', 'Versatile'],
    stock: 75,
    isActive: true,
    rating: {
      average: 4.2,
      count: 25
    }
  },
  {
    pid: 'NV012',
    name: 'Ragi Vermicelli',
    fullName: 'Healthy Ragi Vermicelli - Finger Millet Noodles',
    category: 'Noodles & Vermicelli',
    price: 65,
    weight: '170g',
    description: 'Nutritious ragi vermicelli packed with protein and calcium. Healthy twist to traditional recipes for guilt-free indulgence!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503331334/MH/LP/FW/122442363/double-roasted-rava-500x500.jpeg',
    features: ['Healthy', 'High Protein', 'Nutritious'],
    stock: 50,
    isActive: true,
    rating: {
      average: 4.4,
      count: 17
    }
  },
  {
    pid: 'NV013',
    name: 'Roasted Vermicelli',
    fullName: 'Golden Roasted Vermicelli - Ready to Cook',
    category: 'Noodles & Vermicelli',
    price: 68,
    weight: '170g',
    description: 'Golden roasted vermicelli with perfect texture for creamy kheer, spicy upma, and festive payasam. Ready in just minutes!',
    image: 'https://5.imimg.com/data5/SELLER/Default/2025/4/503331697/IJ/FV/VX/122442363/ragi-flour-500x500.jpeg',
    features: ['Golden Roasted', 'Premium Quality', 'Quick Cooking'],
    stock: 55,
    isActive: true,
    rating: {
      average: 4.5,
      count: 23
    }
  }
];

// Sample users
const sampleUsers = [
  {
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi.kumar@email.com',
    password: 'hashedpassword123',
    phone: '9876543210'
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@email.com', 
    password: 'hashedpassword123',
    phone: '9876543211'
  },
  {
    firstName: 'Arjun',
    lastName: 'Patel',
    email: 'arjun.patel@email.com',
    password: 'hashedpassword123', 
    phone: '9876543212'
  }
];

// Sample orders
const createSampleOrders = async (users, products) => {
  const orders = [];
  const statuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
  
  for (let i = 0; i < 15; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const orderItems = [];
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemTotal = product.price * quantity;
      
      orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        quantity: quantity,
        price: product.price,
        totalPrice: itemTotal
      });
      
      totalAmount += itemTotal;
    }
    
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Orders from last 30 days
    
    orders.push({
      userId: user._id,
      items: orderItems,
      totalAmount: totalAmount,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      shippingAddress: {
        street: '123 Main Street',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        country: 'India'
      },
      customerInfo: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone
      },
      createdAt: orderDate
    });
  }
  
  return orders;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await Product.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    // Create admin user first
    const adminUser = new Admin({
      email: 'admin@sithee.com',
      password: 'admin123',
      name: 'System Admin',
      role: 'superadmin'
    });
    
    const savedAdmin = await adminUser.save();
    console.log(`✅ Created admin user with ID: ${savedAdmin._id}`);
    
    // Add addedBy field to all products
    const productsWithAdmin = sampleProducts.map(product => ({
      ...product,
      addedBy: savedAdmin._id
    }));
    
    // Insert products
    const insertedProducts = await Product.insertMany(productsWithAdmin);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    
    // Insert users
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${insertedUsers.length} users`);
    
    // Create and insert orders
    const sampleOrders = await createSampleOrders(insertedUsers, insertedProducts);
    const insertedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Inserted ${insertedOrders.length} orders`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Database Summary:');
    console.log(`Products: ${await Product.countDocuments()}`);
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Orders: ${await Order.countDocuments()}`);
    console.log(`Total Revenue: ₹${await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => result[0]?.total || 0)}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
