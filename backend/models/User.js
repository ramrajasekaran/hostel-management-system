const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    rollNo: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'warden', 'admin', 'hostel_warden', 'mess_warden', 'parent', 'hostel_employee', 'mess_employee'],
        default: 'student'
    },
    employeeCategory: {
        type: String,
        enum: ['Mess', 'Hostel']
    },
    employeeRole: {
        type: String,
        enum: [
            'Chef', 'Server', 'Cleaner', 'Supervisor', 'Mess Warden',
            'Hostel Warden', 'Room Cleaner', 'Plumber', 'Electrician', 'Laundry'
        ]
    },
    place: String,
    salaryPerDay: {
        type: Number,
        default: 0
    },
    // Detailed Profile Fields
    gender: String,
    fatherName: String,
    dob: String,
    studentMobile: String,
    fatherMobile: String,
    ivrNo: String,
    department: String,
    program: String,
    batch: String,
    admissionType: String,
    registerNo: String,
    hostelName: String,
    roomNo: String,
    fingerprintId: String,
    approvalNo: {
        type: String,
        trim: true
    },
    language: String,
    feesBalance: {
        type: Number,
        default: 0
    },
    feesPaid: {
        type: Number,
        default: 0
    },
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Out'],
        default: 'Absent'
    },
    lastAttendanceAt: Date,
    isBlocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
