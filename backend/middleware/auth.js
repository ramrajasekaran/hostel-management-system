const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            console.log("AUTH FAIL: No token provided");
            return res.status(401).json({ message: 'Authentication required' });
        }

        const secret = process.env.JWT_SECRET || 'hms_arena_secret_key';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id);

        if (!user) {
            console.log("AUTH FAIL: User not found for ID:", decoded.id);
            throw new Error('User not found');
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        console.error("AUTH ERROR:", err.message);
        res.status(401).json({ message: 'Please authenticate' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // 'warden' role has global access to everything
        if (req.user.role === 'warden' || req.user.role === 'admin') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
