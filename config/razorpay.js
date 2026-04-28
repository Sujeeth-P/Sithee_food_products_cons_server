import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RJpJ2wPcnconVu',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'FBFJ339AJogYDCPzwJQp0w9k'
});

export default razorpay;