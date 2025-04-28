// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed
require('dotenv').config();

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (remove 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token payload (we stored id and role)
            // Attach user info (excluding password) to the request object
            // You might want to fetch fresh user data instead of relying solely on the token payload
            // if roles or other critical info can change frequently.
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                 return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Make sure role from token matches current user role (optional extra check)
            if(req.user.role !== decoded.role) {
                console.warn(`JWT Role mismatch for user ${req.user.id}. Token: ${decoded.role}, DB: ${req.user.role}`);
                // Decide how to handle this - log it, maybe deny access?
                // For now, let's allow it but log it. Could indicate an old token after role change.
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
             if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed (invalid signature)' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Optional: Middleware to restrict access based on role
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['admin', 'planner']
        // Assumes 'protect' middleware has already run and attached req.user
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
        }
        next();
    };
};


module.exports = { protect, restrictTo };