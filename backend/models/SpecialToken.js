const mongoose = require('mongoose');

const specialTokenSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenType: {
        type: String,
        enum: ['Digital', 'Manual'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Closed'],
        default: 'Active'
    },
    price: {
        type: Number,
        default: 0
    },
    foodName: String,
    sessionType: String,
    providingDate: String,
    tokenId: {
        type: String,
        unique: true,
        default: () => 'TOK-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: Date,
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('SpecialToken', specialTokenSchema);
