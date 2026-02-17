const mongoose = require('mongoose');
const SystemConfig = require('./models/SystemConfig');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management')
    .then(async () => {
        const config = await SystemConfig.findOne({ key: 'main_security' });
        console.log(`SESSION: ${config.specialFoodSession}`);
        console.log(`DATE_CONFIG: ${config.specialFoodDate}`);

        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const todayStr = `${d}.${m}.${y}`;

        console.log(`DATE_SERVER: ${todayStr}`);
        console.log(`MATCH: ${config.specialFoodDate === todayStr}`);
        console.log(`TIME_START: ${config.specialFoodStartTime}`);
        console.log(`TIME_END: ${config.specialFoodEndTime}`);
        console.log(`TIME_NOW: ${now.getHours()}:${now.getMinutes()}`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
