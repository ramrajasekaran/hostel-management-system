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
    specialFoodNames: {
        type: [String],
        default: []
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
    specialFoodDay: {
        type: String, // e.g., monday, everyday
        default: ''
    },
    specialFoodMasterList: {
        type: [{
            day: { type: String, required: true }, // e.g., monday, everyday
            session: { type: String, required: true }, // e.g., breakfast, all
            name: { type: String, required: true }
        }],
        default: []
    },
    regularMenu: {
        breakfast: {
            mainDish: { type: String, default: '' },
            sideDish: { type: String, default: '' },
            vegMain: { type: String, default: '' },
            vegSide: { type: String, default: '' },
            nonVegMain: { type: String, default: '' },
            nonVegSide: { type: String, default: '' },
            isClosed: { type: Boolean, default: false }
        },
        lunch: {
            mainDish: { type: String, default: '' },
            sideDish: { type: String, default: '' },
            vegMain: { type: String, default: '' },
            vegSide: { type: String, default: '' },
            nonVegMain: { type: String, default: '' },
            nonVegSide: { type: String, default: '' },
            isClosed: { type: Boolean, default: false }
        },
        dinner: {
            mainDish: { type: String, default: '' },
            sideDish: { type: String, default: '' },
            vegMain: { type: String, default: '' },
            vegSide: { type: String, default: '' },
            nonVegMain: { type: String, default: '' },
            nonVegSide: { type: String, default: '' },
            isClosed: { type: Boolean, default: false }
        },
        lastUpdated: { type: Date, default: Date.now }
    },
    weeklyMenu: {
        monday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        tuesday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        wednesday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        thursday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        friday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        saturday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        },
        sunday: {
            breakfast: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            lunch: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } },
            dinner: { mainDish: { type: String, default: '' }, sideDish: { type: String, default: '' }, vegMain: { type: String, default: '' }, vegSide: { type: String, default: '' }, nonVegMain: { type: String, default: '' }, nonVegSide: { type: String, default: '' } }
        }
    },
    specialFoodClosed: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
