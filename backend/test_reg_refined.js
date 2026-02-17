const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '.env') });
const secret = process.env.JWT_SECRET || 'hms_arena_secret_key';

async function testRegistration() {
    try {
        console.log("Generating warden token...");
        const token = jwt.sign({ id: '65ce5d9a9f8f4a1234567890', role: 'warden' }, secret, { expiresIn: '1h' });
        console.log("Token generated.");

        const studentData = {
            name: "Verified Refined Student",
            rollNo: "REF" + Date.now(),
            password: "password123",
            role: "student",
            department: "Artificial Intelligence and Machine Learning",
            program: "B.Tech.",
            batch: "2023-2027",
            admissionType: "Hosteller",
            studentMobile: "9876543210",
            fatherMobile: "1234567890",
            ivrNo: "1122334455",
            approvalNo: "APP_REF_001",
            registerNo: "REG_REF_001",
            gender: "Male",
            dob: "2005-01-01",
            fatherName: "Test Father",
            hostelName: "Gents Hostel",
            roomNo: "101",
            language: "Tamil"
        };

        console.log("Registering refined student via API...");
        const regRes = await axios.post('http://localhost:5000/api/auth/register', studentData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Registration Response:", regRes.data);
    } catch (err) {
        console.error("Test failed:", err.response?.data || err.message);
    }
}

testRegistration();
