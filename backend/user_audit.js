const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Leave = require('./models/Leave');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ role: 'student' });
    console.log('--- ALL STUDENTS ---');
    users.forEach(u => {
        console.log(`ID: ${u._id} | Name: ${u.name} | ApprovalNo: "${u.approvalNo}"`);
    });

    const leaves = await Leave.find({});
    console.log('\n--- ALL LEAVES ---');
    leaves.forEach(l => {
        console.log(`LeaveID: ${l._id} | StudentID: ${l.student} | Type: ${l.leaveType} | Status: ${l.wardenStatus}`);
    });
    process.exit(0);
}
check();
