const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Fee = require('../models/Fee');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Protect all payment routes
router.use(authenticate);

// Create Order API
router.post('/create-order', async (req, res) => {
    console.log("PAYMENT ROUTE HIT: /create-order", req.body);
    try {
        const { amount, feeType = "Hostel", currency = "INR" } = req.body;

        // Basic validation and Transaction Limits
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const MAX_PAYMENT_AMOUNT = 500000; // ₹5,00,000 limit
        if (amount > MAX_PAYMENT_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Amount exceeds maximum limit of ₹${MAX_PAYMENT_AMOUNT.toLocaleString()}. Please pay in smaller installments.`
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Amount in paise, ensure integer
            currency,
            receipt: `rcpt_${Date.now().toString().slice(-8)}_${req.user._id.toString().slice(-6)}`,
            notes: {
                studentId: req.user._id.toString(),
                feeType: feeType,
                hostelAmount: req.body.hostelAmount || 0,
                messAmount: req.body.messAmount || 0
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ success: false, message: "Order creation failed" });
    }
});

// Verify Payment API
router.post('/verify', async (req, res) => {
    console.log("PAYMENT ROUTE HIT: /verify", req.body);
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {

            // Verify payment amount and status with Razorpay
            const payment = await razorpay.payments.fetch(razorpay_payment_id);

            if (payment.status !== 'captured') {
                return res.status(400).json({ success: false, message: "Payment not captured" });
            }

            const amountPaid = payment.amount / 100; // Convert paise to rupees
            const studentId = req.user._id;
            const feeType = payment.notes.feeType || 'Hostel';
            const hostelAmount = Number(payment.notes.hostelAmount || 0);
            const messAmount = Number(payment.notes.messAmount || 0);

            // Payment Success - Create Fee Record
            const newFee = new Fee({
                student: studentId,
                amount: amountPaid,
                feeType,
                hostelAmount,
                messAmount,
                paymentMethod: 'Razorpay',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'Success'
            });

            await newFee.save();

            // Update User Balance & Specific Fee Type
            const updateFields = {
                $inc: { feesPaid: amountPaid, feesBalance: -amountPaid }
            };

            if (feeType === 'Both') {
                if (hostelAmount > 0) updateFields.$inc['hostelFees.paid'] = hostelAmount;
                if (messAmount > 0) updateFields.$inc['messFees.paid'] = messAmount;
            } else if (feeType === 'Hostel') {
                updateFields.$inc['hostelFees.paid'] = amountPaid;
            } else if (feeType === 'Mess') {
                updateFields.$inc['messFees.paid'] = amountPaid;
            }

            await User.findByIdAndUpdate(studentId, updateFields);

            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
});

module.exports = router;
