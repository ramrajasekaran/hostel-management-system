const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management';
const JWT_SECRET = process.env.JWT_SECRET || 'hms_arena_secret_key';

async function testRBAC() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Create or Find test users for each role
        const roles = ['student', 'warden', 'hostel_warden', 'mess_warden'];
        const testUsers = {};

        for (const role of roles) {
            let user = await User.findOne({ role });
            if (!user) {
                console.log(`Creating test user for role: ${role}`);
                const userData = {
                    name: `Test ${role}`,
                    password: 'password123',
                    role: role
                };
                if (role === 'student') {
                    userData.rollNo = 'TEST_STUDENT_001';
                    userData.email = `test_${role}@example.com`;
                } else {
                    userData.username = `user_${role}`;
                }
                user = new User(userData);
                await user.save();
            }
            testUsers[role] = user;
        }

        console.log("\n--- Testing Route Access Logic ---\n");

        const { authenticate, authorize } = require('./middleware/auth');

        // Mock Express Req/Res
        function mockRequest(user) {
            return {
                header: (name) => {
                    if (name === 'Authorization') {
                        return 'Bearer ' + jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
                    }
                    return null;
                },
                user: user
            };
        }

        function mockResponse() {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.jsonData = data;
                return res;
            };
            return res;
        }

        const cases = [
            { role: 'student', allowedRoles: ['student'], expected: 'Allowed' },
            { role: 'student', allowedRoles: ['warden'], expected: 'Denied' },
            { role: 'hostel_warden', allowedRoles: ['warden', 'hostel_warden'], expected: 'Allowed' },
            { role: 'hostel_warden', allowedRoles: ['mess_warden'], expected: 'Denied' },
            { role: 'mess_warden', allowedRoles: ['warden', 'mess_warden'], expected: 'Allowed' },
            { role: 'warden', allowedRoles: ['student'], expected: 'Allowed' }, // Warden has full access
            { role: 'warden', allowedRoles: ['mess_warden'], expected: 'Allowed' }
        ];

        for (const c of cases) {
            const user = testUsers[c.role];
            const middleware = authorize(...c.allowedRoles);
            const req = mockRequest(user);
            const res = mockResponse();
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            middleware(req, res, next);

            const result = nextCalled ? 'Allowed' : 'Denied';
            console.log(`Role: ${c.role.padEnd(15)} | Required: ${c.allowedRoles.join(',').padEnd(25)} | Result: ${result.padEnd(10)} | Expected: ${c.expected}`);

            if (result !== c.expected) {
                console.error(`❌ FAILURE in case: ${JSON.stringify(c)}`);
            }
        }

        console.log("\n--- Verification Complete ---");
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    }
}

testRBAC();
