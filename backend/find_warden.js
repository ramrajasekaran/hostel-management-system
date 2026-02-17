const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'warden' });
        console.log('WARDENS:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
