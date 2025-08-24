import express from 'express'

import { registerUser, loginUser, getCurrentUser, getAllUsers } from '../controller/authController.js'
import { getProducts, getProduct, updateProductStock, processPurchase } from '../controller/productController.js'
import { getDashboardStats, getMonthlyAnalytics } from '../controller/dashboardController.js'
import { authUser } from '../middleware/auth.js'

const route = express.Router()

// Authentication routes
route.post("/signup", registerUser)
route.post("/login", loginUser)
route.get("/me", authUser, getCurrentUser)
route.get("/users", getAllUsers) // Get all users for dashboard

// Public product routes (no authentication required)
route.get("/products", getProducts)
route.get("/products/:id", getProduct)

// Stock management routes (for purchases)
route.post("/products/update-stock", updateProductStock)
route.post("/products/process-purchase", processPurchase)

// Dashboard routes
route.get("/dashboard/stats", getDashboardStats)
route.get("/dashboard/analytics", getMonthlyAnalytics)

export default route;
