const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const secret = process.env.JWT_SECRET || 'hms_arena_secret_key';
const url = 'http://localhost:5000/api/auth/register';

async function debugRegistration() {
    // 1. Create a dummy token for a warden
    const token = jwt.sign({ id: '65ce5d9a9f8f4a1234567890', role: 'warden' }, secret, { expiresIn: '1h' });

    console.log("Using Secret:", secret);
    console.log("Generated Token:", token);

    try {
        const res = await axios.post(url, {
            name: "Debug User",
            username: "debug_user_" + Date.now(),
            password: "password123",
            role: "student",
            rollNo: "DEBUG_" + Date.now()
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("SUCCESS:", res.data);
    } catch (err) {
        console.error("FAILURE:", err.response?.status, err.response?.data);
        if (err.response?.data?.message === 'Please authenticate') {
            console.error("DEBUG: Backend returned 'Please authenticate'. This confirms secret or decoding issue.");
        }
    }
}

debugRegistration();
