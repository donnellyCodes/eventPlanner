// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
require('dotenv').config();

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, role } = req.body;

    // Basic validation for role
    if (!['client', 'planner', 'vendor'].includes(role)) {
         return res.status(400).json({ message: 'Invalid user role specified.' });
    }

    try {
        // Check if user already exists (handled by model now, but good practice)
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create user (password hashing is done in the model)
        const newUser = await User.create({ fullName, email, password, role });

        // Respond with user info and token
        res.status(201).json({
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            token: generateToken(newUser.id, newUser.role),
        });

    } catch (error) {
        console.error("Registration Error:", error);
        // Handle potential specific errors from the model (like UNIQUE constraint)
        if (error.message === 'Email already exists.') {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
     // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findByEmail(email);

        // Check if user exists and if password matches
        if (user && (await User.comparePassword(password, user.password))) {
            // User authenticated, respond with user info and token
            res.json({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role), // Generate token with ID and role
            });
        } else {
            // Authentication failed
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};