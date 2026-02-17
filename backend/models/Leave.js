const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['Leave', 'General Leave', 'Emergency', 'Outing'],
        required: true
    },
    outDate: {
        type: Date,
        required: true
    },
    outTime: {
        type: String, // format HH:MM
        required: true
    },
    inDate: {
        type: Date,
        required: true
    },
    inTime: {
        type: String, // format HH:MM
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    wardenStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    parentStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    outpassType: {
        type: String,
        enum: ['None', 'Digital', 'Physical'],
        default: 'None'
    },
    outpassGeneratedAt: Date,
    outpassStatus: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Leave', leaveSchema);
