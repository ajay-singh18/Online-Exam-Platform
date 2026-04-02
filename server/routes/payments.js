const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
