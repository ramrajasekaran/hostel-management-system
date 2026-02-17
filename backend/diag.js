const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('UserDiagnostic', userSchema, 'users');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management');
        const latestStudent = await mongoose.connection.db.collection('users').find({ role: 'student' }).sort({ createdAt: -1 }).limit(1).toArray();
        console.log('--- LATEST STUDENT RECORD ---');
        console.log(JSON.stringify(latestStudent[0], null, 2));
        console.log('-----------------------------');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
}

check();
