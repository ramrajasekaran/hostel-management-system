const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user (Restricted to Warden roles)
router.post('/register', authenticate, authorize('warden', 'admin', 'hostel_warden', 'mess_warden'), async (req, res) => {
    console.log("REGISTRATION REQUEST BODY:", req.body);
    try {
        const {
            name, email, password, role, rollNo, username,
            gender, fatherName, dob, studentMobile, fatherMobile, ivrNo,
            department, program, batch, admissionType, registerNo,
            hostelName, roomNo, fingerprintId, approvalNo, language,
            employeeCategory, employeeRole, place, salaryPerDay
        } = req.body;

        // Requirement: Students must have a rollNo
        if (role === 'student' && !rollNo) {
            return res.status(400).json({ message: 'Roll Number is required for students' });
        }

        // Check if student with same rollNo already exists
        if (rollNo) {
            const existingRoll = await User.findOne({ rollNo });
            if (existingRoll) {
                return res.status(400).json({ message: 'Roll Number already registered' });
            }
        }

        if (email && email.trim() !== "") {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Check if username already exists
        if (username && username.trim() !== "") {
            const existingUsername = await User.findOne({ username: username.trim() });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        // Determine final password (generate placeholder if missing for regular employees)
        const finalPassword = password || `no-login-${Math.random().toString(36).substring(7)}`;

        let userData = {
            name, role, password: finalPassword
        };

        if (role === 'student') {
            userData = {
                ...userData,
                gender, fatherName, dob, studentMobile, fatherMobile, ivrNo,
                department, program, batch, admissionType, registerNo,
                hostelName, roomNo, fingerprintId, approvalNo, language
            };
            if (rollNo && rollNo.trim() !== "") userData.rollNo = rollNo.trim();
            if (email && email.trim() !== "") userData.email = email.trim().toLowerCase();
            if (username && username.trim() !== "") userData.username = username.trim();
        } else {
            // For Wardens and Employees
            const requiresLogin = ['warden', 'admin', 'hostel_warden', 'mess_warden'].includes(role);

            if (requiresLogin && (!username || username.trim() === "")) {
                return res.status(400).json({ message: 'Username is required for management roles' });
            }

            if (username && username.trim() !== "") {
                userData.username = username.trim();
            }

            // Employee fields
            if (employeeCategory) userData.employeeCategory = employeeCategory;
            if (employeeRole) userData.employeeRole = employeeRole;
            if (place) userData.place = place;
            if (salaryPerDay) userData.salaryPerDay = salaryPerDay;
        }

        console.log("FINAL USER DATA TO SAVE:", userData);
        const user = new User(userData);
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });
    } catch (err) {
        console.error("Registration Error Detail:", err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token (supports Email or Roll No)
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // 'identifier' can be email or rollNo

        const user = await User.findOne({
            $or: [
                { email: identifier?.toLowerCase() },
                { rollNo: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ message: 'your id is blocked .contact warden to un block id' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'hms_arena_secret_key',
            { expiresIn: '1d' }
        );

        // Return user info WITHOUT password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            token,
            user: userResponse
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
