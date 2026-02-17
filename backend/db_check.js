const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Leave = require('./models/Leave');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- ALL USERS ---');
        const users = await User.find({}).select('name role approvalNo rollNo registerNo');
        users.forEach(u => {
            console.log(`[${u.role}] Name: ${u.name} | AppNo: "${u.approvalNo}" | RegNo: "${u.registerNo}" | RollNo: "${u.rollNo}"`);
        });

        console.log('\n--- ALL LEAVES ---');
        const leaves = await Leave.find({}).populate('student', 'name approvalNo');
        leaves.forEach(l => {
            console.log(`[${l.wardenStatus}] Type: ${l.leaveType} | Student: ${l.student?.name} | AppNo: "${l.student?.approvalNo}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
