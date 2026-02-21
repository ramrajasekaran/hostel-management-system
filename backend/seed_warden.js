const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        let warden = await User.findOne({ role: 'warden' });

        if (!warden) {
            console.log("No warden found. Creating one...");
            warden = new User({
                name: "System Warden",
                role: "warden",
                username: "sys_warden",
                email: "warden@system.com",
                password: "password123"
            });
            await warden.save();
            console.log("Warden created.");
        } else {
            console.log("Warden already exists.");
        }

        console.log("Warden ID:", warden._id.toString());
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

seed();
