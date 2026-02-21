const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const SystemConfig = require('./models/SystemConfig');

async function reset() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Manually Reset all 'Present' to 'Absent'
        const result = await User.updateMany(
            { role: 'student', attendanceStatus: 'Present' },
            { $set: { attendanceStatus: 'Absent' } }
        );
        console.log(`Manually reset ${result.modifiedCount} students from 'Present' to 'Absent'.`);

        // 2. Clear lastResetDate to force cron to run again if needed
        await SystemConfig.findOneAndUpdate(
            { key: 'main_security' },
            { $set: { lastResetDate: '' } }
        );
        console.log("Cleared system reset date to ensure daily job triggers next run.");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

reset();
