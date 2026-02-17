const mongoose = require('mongoose');
const SystemConfig = require('./models/SystemConfig');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for migration...');

        const config = await SystemConfig.findOne({ key: 'main_security' });
        if (!config) {
            console.log('No configuration found.');
            process.exit(0);
        }

        let updated = false;

        // Migrate regularMenu
        if (config.regularMenu) {
            ['breakfast', 'lunch', 'dinner'].forEach(session => {
                if (config.regularMenu[session]) {
                    const s = config.regularMenu[session];
                    if (s.mainDish && !s.vegMain) {
                        s.vegMain = s.mainDish;
                        s.vegSide = s.sideDish || '';
                        updated = true;
                    }
                }
            });
        }

        // Migrate weeklyMenu
        if (config.weeklyMenu) {
            Object.keys(config.weeklyMenu).forEach(day => {
                if (day !== '_id' && config.weeklyMenu[day]) {
                    ['breakfast', 'lunch', 'dinner'].forEach(session => {
                        if (config.weeklyMenu[day][session]) {
                            const s = config.weeklyMenu[day][session];
                            if (s.mainDish && !s.vegMain) {
                                s.vegMain = s.mainDish;
                                s.vegSide = s.sideDish || '';
                                updated = true;
                            }
                        }
                    });
                }
            });
        }

        if (updated) {
            await config.save();
            console.log('Migration completed successfully: main/side copied to vegMain/vegSide.');
        } else {
            console.log('No migration needed (fields already populated or empty).');
        }

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
