const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'main_security'
    },
    attendanceStart: {
        type: String,
        required: true,
        default: '19:00' // 7:00 PM
    },
    attendanceEnd: {
        type: String,
        required: true,
        default: '20:00' // 8:00 PM
    },
    collegeEndTime: {
        type: String,
        required: true,
        default: '16:00' // 4:00 PM
    },
    curfewTime: {
        type: String,
        required: true,
        default: '22:00' // 22:00 (10:00 PM)
    },
    // Fee & Mess Configuration
    feeStructureType: {
        type: String,
        enum: ['Common', 'Separate'],
        default: 'Common'
    },
    hostelFee: {
        type: Number,
        default: 30000 // Total per year (2 semesters)
    },
    hostelBillingCycle: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Yearly'
    },
    fixedMessFee: {
        type: Number,
        default: 50000 // Total per year (Common mode)
    },
    messBillingCycle: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        default: 'Yearly'
    },
    commonFoodFee: {
        type: Number,
        default: 25000 // For separate mode fixed portion
    },
    // Special Food Scheduling
    specialFoodName: {
        type: String,
        default: ''
    },
    specialFoodDate: {
        type: String, // YYYY-MM-DD
        default: ''
    },
    specialFoodStartTime: {
        type: String, // HH:MM
        default: ''
    },
    specialFoodEndTime: {
        type: String, // HH:MM
        default: ''
    },
    specialFoodSession: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'None'],
        default: 'None'
    },
    specialFoodProvidingDate: {
        type: String, // YYYY-MM-DD
        default: ''
    },
    specialFoodMasterList: {
        type: [String],
        default: []
    },
    regularMenu: {
        mainDish: { type: String, default: '' },
        sideDish: { type: String, default: '' },
        lastUpdated: { type: Date, default: Date.now }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
