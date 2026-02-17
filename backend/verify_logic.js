const mongoose = require('mongoose');
const Leave = require('./models/Leave');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management';

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const rollNo = '22BAL049';
        const user = await User.findOne({ rollNo });
        if (!user) {
            console.error("Student not found");
            process.exit(1);
        }

        console.log(`Checking student: ${user.name} (${user.rollNo})`);
        console.log(`Current Attendance Status: ${user.attendanceStatus}`);

        // 1. Ensure user is marked as 'Out' and has an approved leave with an outpass
        user.attendanceStatus = 'Out';
        await user.save();

        let leave = await Leave.findOne({ student: user._id }).sort({ createdAt: -1 });
        if (!leave) {
            console.log("No leave found, creating a dummy approved leave...");
            leave = new Leave({
                student: user._id,
                leaveType: 'General Leave',
                outDate: new Date(),
                outTime: '08:00',
                inDate: new Date(),
                inTime: '20:00',
                reason: 'Verification Test',
                wardenStatus: 'Approved',
                parentStatus: 'Approved',
                outpassType: 'Digital'
            });
            await leave.save();
        } else {
            // Update latest leave for test
            leave.wardenStatus = 'Approved';
            leave.parentStatus = 'Approved';
            leave.outpassType = 'Digital';
            leave.outpassStatus = 'Open';
            await leave.save();
        }

        console.log(`Leave found ID: ${leave._id}`);
        console.log(`Outpass Status (Before): ${leave.outpassStatus}`);

        await mongoose.disconnect(); // Close connection before starting HTTP test

        // 2. Perform HTTP POST to mark attendance
        console.log("\nCalling Attendance Mark API...");
        const http = require('http');
        const postData = JSON.stringify({ rollNo: '22BAL049' });

        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/student/attendance/mark',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', async () => {
                console.log(`Status Code: ${res.statusCode}`);
                console.log(`Response: ${body}`);

                // 3. Re-connect and verify DB state
                await mongoose.connect(MONGO_URI);
                const updatedLeave = await Leave.findById(leave._id);
                const updatedUser = await User.findOne({ rollNo: '22BAL049' });

                console.log("\n--- Verification Results ---");
                console.log(`Attendance Status: ${updatedUser.attendanceStatus}`);
                console.log(`Outpass Status (After): ${updatedLeave.outpassStatus}`);

                if (updatedLeave.outpassStatus === 'Closed' && updatedUser.attendanceStatus === 'Present') {
                    console.log("\n✅ SUCCESS: Outpass closed and attendance marked!");
                } else {
                    console.log("\n❌ FAILURE: Verification failed.");
                }

                await mongoose.disconnect();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
        });

        req.write(postData);
        req.end();

    } catch (err) {
        console.error(err);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    }
}

verify();
