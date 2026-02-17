const mongoose = require('mongoose');
const SystemConfig = require('./models/SystemConfig');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management')
    .then(async () => {
        console.log("Connected to DB");
        const config = await SystemConfig.findOne({ key: 'main_security' });
        console.log("Current Config:");
        console.log(JSON.stringify(config, null, 2));

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const todayStr = `${d}.${m}.${y}`;
        console.log(`Server Date Calculation: ${todayStr}`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
