import express from 'express';
import { createOrder, createGuestOrder, getUserOrders, getOrderById, updateOrderStatus, getAllOrders, cancelOrder } from '../controller/orderController.js';
import { authUser } from '../middleware/auth.js';

const router = express.Router();

// Order routes
router.get('/', authUser, getAllOrders); // Get all orders (admin)
router.post('/', authUser, createOrder); // For authenticated users
router.post('/guest', createGuestOrder); // For guest checkout (no auth required)
router.get('/user', authUser, getUserOrders); // Get logged-in user's orders
router.get('/:id', authUser, getOrderById);
router.put('/:id/status', authUser, updateOrderStatus);
router.put('/:id/cancel', authUser, cancelOrder); // Cancel order for users

export default router;