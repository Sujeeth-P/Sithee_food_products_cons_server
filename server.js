import connectDB from "./db/db.js";
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import route from './routes/routes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js' 
import { createServer } from 'http'
import { Server } from 'socket.io'

// Load environment variables
dotenv.config()

//delcration
const PORT = process.env.PORT || 5000
const app = express()

// Create HTTP server for Socket.IO
const server = createServer(app)

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [   
      process.env.VITE_CLIENT_URL,
      process.env.VITE_CLIENT_URL_2,
      'https://sithee-food-products-cons-server.onrender.com'
    ],
    methods: ["GET", "POST"]
  }
})

// Make io available to controllers
app.set('io', io)

//func call
connectDB()

//middle wares
app.use(express.json())
app.use(cors());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id)
  
  // Handle admin joining
  socket.on('join-admin', () => {
    socket.join('admin-room')
    console.log('👑 Admin joined:', socket.id)
  })
  
  // Handle user joining their specific room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`)
    console.log(`👤 User ${userId} joined:`, socket.id)
  })
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
  })
})

app.use('/sithee', route)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes)  

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled for real-time updates`);
})