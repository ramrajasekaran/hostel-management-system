const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');

// Helper to convert HH:MM to minutes
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Helper to get today's date string YYYY-MM-DD
const getTodayDateStr = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

const runDailyResetJob = async (io) => {
    try {
        const config = await SystemConfig.findOne({ key: 'main_security' });
        if (!config) return;

        const todayStr = getTodayDateStr();

        // Run if last reset was NOT today (meaning it's a new day)
        if (config.lastResetDate !== todayStr) {
            console.log(`[DailyReset] New Day Detected (${todayStr}). Resetting attendance...`);

            const result = await User.updateMany(
                { role: 'student', attendanceStatus: 'Present' },
                { $set: { attendanceStatus: 'Absent', lastAttendanceAt: null } }
            );

            console.log(`[DailyReset] Reset ${result.modifiedCount} students from Present to Absent.`);

            if (io) {
                io.emit('census_update', { type: 'RESET', message: 'Daily Attendance Reset' });
            }

            config.lastResetDate = todayStr;
            await config.save();
        }
    } catch (err) {
        console.error("[DailyReset] Job Error:", err);
    }
};

const runAutoBlockJob = async (io) => {
    try {
        const config = await SystemConfig.findOne({ key: 'main_security' });
        if (!config) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = timeToMinutes(config.attendanceEnd);
        const todayStr = getTodayDateStr();

        if (currentMinutes > endMinutes && config.lastAutoBlockDate !== todayStr) {
            console.log(`[AutoBlock] Time passed (${config.attendanceEnd}). Running auto-block job for ${todayStr}...`);

            const result = await User.updateMany(
                {
                    role: 'student',
                    attendanceStatus: { $nin: ['Present', 'Out'] },
                    isBlocked: false
                },
                {
                    $set: {
                        isBlocked: true,
                        attendanceStatus: 'Absent'
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[AutoBlock] Blocked ${result.modifiedCount} absentee students.`);
                if (io) {
                    io.emit('auto_block_trigger', {
                        count: result.modifiedCount,
                        message: `Auto-Blocked ${result.modifiedCount} absentees.`
                    });
                }
            } else {
                console.log(`[AutoBlock] No new students to block.`);
            }

            config.lastAutoBlockDate = todayStr;
            await config.save();
        }

    } catch (err) {
        console.error("[AutoBlock] Job Error:", err);
    }
};

const initCron = (io) => {
    console.log("[Cron] Service started. Checking every 60 seconds.");

    // Check immediately on startup
    runAutoBlockJob(io);
    runDailyResetJob(io);

    // Loop
    setInterval(() => {
        runAutoBlockJob(io);
        runDailyResetJob(io);
    }, 60 * 1000);
};

module.exports = { initCron };
