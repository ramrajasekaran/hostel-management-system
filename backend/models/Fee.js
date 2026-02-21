const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    transactionId: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substring(2, 10).toUpperCase()
    },
    status: {
        type: String,
        enum: ['Success', 'Pending', 'Failed'],
        default: 'Success'
    },
    paymentMethod: {
        type: String,
        default: 'Online'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    feeType: {
        type: String,
        enum: ['Hostel', 'Mess', 'Both'],
        default: 'Hostel'
    },
    hostelAmount: {
        type: Number,
        default: 0
    },
    messAmount: {
        type: Number,
        default: 0
    },
    razorpaySignature: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
