import express from 'express';
import { createOrder, verifyPayment } from '../controller/paymentController.js';
const router = express.Router();

// Create a new payment order
router.post('/create-order', createOrder);

// Verify payment
router.post('/verify-payment', verifyPayment);

export default router;